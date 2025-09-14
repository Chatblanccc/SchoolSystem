import csv
import io
from typing import List, Optional

from django.db import transaction
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view

from .models import Lesson, Room
from apps.courses.models import Course
from apps.teachers.models import Teacher
from apps.schools.models import Class as SchoolClass
from .serializers import LessonSerializer


def try_decode(data: bytes) -> str:
    for enc in ['utf-8-sig','utf-8','gbk','gb18030','cp936']:
        try:
            return data.decode(enc)
        except Exception:
            continue
    raise UnicodeDecodeError('unknown','',0,1,'无法解码文件，请使用 UTF-8 或 GBK')


class TimetableImportView(APIView):
    @transaction.atomic
    def post(self, request):
        file = request.FILES.get('file')
        term = request.POST.get('term')
        mode = request.POST.get('mode','append')
        if not file or not term:
            return Response({
                'success': False,
                'error': {'code':'VALIDATION_ERROR','message':'文件与学期必填','details':{'file':['必填'],'term':['必填']}},
            }, status=status.HTTP_400_BAD_REQUEST)

        if mode == 'overwrite':
            Lesson.objects.filter(term=term).delete()

        # 若为 Excel，优先按 Excel 表格课表样式解析；否则回退 CSV
        name = getattr(file, 'name', '').lower()
        rows = []
        if name.endswith('.xlsx') or name.endswith('.xls'):
            try:
                import openpyxl  # type: ignore
                wb = openpyxl.load_workbook(file, data_only=True)
                ws = wb.active
                # 支持两种 Excel 样式：
                # A) 第一列是“班级”，第一行是“星期*”合并，第二行“上午/下午”，第三行 1..9 节；第4行开始为各班级
                # B) 第一列是“节次/时间”，第一行是“星期*”，第二行可选“上午/下午”，后续为时间行

                A1 = str(ws.cell(row=1, column=1).value or '').strip()
                # 通用：解析第一行的星期列映射
                headers = []
                for col in ws.iter_cols(min_row=1, max_row=1):
                    headers.append(str(col[0].value or '').strip())
                day_alias = {'周一':1,'星期一':1,'一':1,'周二':2,'星期二':2,'二':2,'周三':3,'星期三':3,'三':3,'周四':4,'星期四':4,'四':4,'周五':5,'星期五':5,'五':5,'周六':6,'星期六':6,'六':6,'周日':7,'星期日':7,'日':7}
                # 处理合并单元格：向右填充最后出现的星期
                day_cols = []
                last_d = None
                for h in headers:
                    d = day_alias.get(h, None)
                    if d:
                        last_d = d
                    day_cols.append(d or last_d)
                # 若整行为空，尝试用工作表标题判断
                day_from_ws_title = day_alias.get(ws.title, None)

                if '班级' in A1:
                    # 样式A：按班级为行
                    # 第三行应为节次数字；若不是，尝试从第二行读取
                    period_row = 3
                    period_values = [str(c.value or '').strip() for c in ws[period_row]] if ws.max_row >= 3 else []
                    if not any(v == '1' for v in period_values):
                        period_row = 2
                        period_values = [str(c.value or '').strip() for c in ws[period_row]]
                    start_row = 4 if period_row == 3 else 3
                    max_cols = ws.max_column
                    # 遍历每个班级行
                    for r in range(start_row, ws.max_row + 1):
                        class_name = str(ws.cell(row=r, column=1).value or '').strip()
                        if not class_name:
                            continue
                        for c_idx in range(2, max_cols + 1):
                            day = day_cols[c_idx - 1] if c_idx - 1 < len(day_cols) else None
                            if not day:
                                day = day_from_ws_title
                            if not day:
                                continue
                            p_val = str(ws.cell(row=period_row, column=c_idx).value or '').strip()
                            if not p_val.isdigit():
                                continue
                            start_period = int(p_val)
                            cell_val = ws.cell(row=r, column=c_idx).value
                            if not cell_val:
                                continue
                            text = str(cell_val).strip()
                            if not text:
                                continue
                            course_name = text.split('\n')[0].strip()
                            rest = text.split('\n')[1].strip() if '\n' in text else ''
                            teacher_name = ''
                            room_name = ''
                            if rest:
                                parts = [p.strip() for p in rest.replace('＠','@').split('@')]
                                teacher_name = parts[0] if parts else ''
                                room_name = parts[1] if len(parts) > 1 else ''
                            rows.append({
                                'day': day,
                                'course_name': course_name,
                                'teacher_name': teacher_name,
                                'room': room_name,
                                'class_name': class_name,
                                'start_period': start_period,
                                'end_period': start_period,
                            })
                else:
                    # 样式B：按时间为行（旧方案）
                    second_row_values = [str(c.value or '').strip() for c in ws[2]] if ws.max_row >= 2 else []
                    has_ampm = any(v in ['上午','下午'] for v in second_row_values)
                    start_row = 3 if has_ampm else 2
                    for r in ws.iter_rows(min_row=start_row):
                        time_label = str(r[0].value or '').strip()
                        for c_idx in range(1, len(r)):
                            day = day_cols[c_idx] if c_idx < len(day_cols) else None
                            if not day:
                                day = day_from_ws_title
                            if not day:
                                continue
                            cell = r[c_idx].value
                            if not cell:
                                continue
                            text = str(cell).strip()
                            if not text:
                                continue
                            course_name = text.split('\n')[0].strip()
                            rest = text.split('\n')[1].strip() if '\n' in text else ''
                            teacher_name = ''
                            room_name = ''
                            if rest:
                                parts = [p.strip() for p in rest.replace('＠','@').split('@')]
                                teacher_name = parts[0] if parts else ''
                                room_name = parts[1] if len(parts) > 1 else ''
                            rows.append({
                                'day': day,
                                'course_name': course_name,
                                'teacher_name': teacher_name,
                                'room': room_name,
                                'time_label': time_label,
                            })
            except Exception as e:
                return Response({'success': False, 'error': {'code':'INVALID_FILE', 'message': f'Excel 解析失败: {e}'}}, status=status.HTTP_400_BAD_REQUEST)
        else:
            content = file.read()
            text = try_decode(content)
            f = io.StringIO(text)
            reader = csv.DictReader(f)
            rows = list(reader)
        normalized_rows: List[dict] = []

        # 表头同义映射
        alias = {
            'term':['term','学期'],
            'weeks':['weeks','周次'],
            'day':['day','星期','星期几'],
            'start_time':['start_time','开始时间'],
            'end_time':['end_time','结束时间'],
            'start_period':['start_period','开始节次'],
            'end_period':['end_period','结束节次'],
            'course_name':['course_name','课程名称','课程'],
            'teacher_name':['teacher_name','教师名称','老师','授课老师'],
            'class_name':['class_name','班级名称','班级'],
            'room':['room','教室','教室名称'],
            'week_type':['week_type','单双周'],
            'remark':['remark','备注'],
        }

        def get_val(row, key):
            for k in alias.get(key, [key]):
                if k in row and row[k] is not None:
                    return str(row[k]).strip()
            return ''

        day_map = {'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':7,'天':7,'周一':1,'周二':2,'周三':3,'周四':4,'周五':5,'周六':6,'周日':7,'Mon':1,'Tue':2,'Wed':3,'Thu':4,'Fri':5,'Sat':6,'Sun':7}

        created = 0
        for row in rows:
            course_name = get_val(row,'course_name')
            if not course_name:
                continue
            d = str(get_val(row,'day'))
            if d.isdigit():
                day_of_week = int(d)
            else:
                day_of_week = day_map.get(d, 1)
            # Excel 课表样式下可用 time_label 推断时间/节次；这里先直接落时间为空，由前端按节次渲染
            start_time = get_val(row,'start_time')
            end_time = get_val(row,'end_time')
            start_period = get_val(row,'start_period')
            end_period = get_val(row,'end_period')
            teacher_name = get_val(row,'teacher_name')
            class_name = get_val(row,'class_name')
            room_name = get_val(row,'room')
            week_type = get_val(row,'week_type')
            weeks = get_val(row,'weeks')
            remark = get_val(row,'remark')

            course = Course.objects.filter(name=course_name).first()
            teacher = Teacher.objects.filter(name=teacher_name).first() if teacher_name else None
            class_obj = SchoolClass.objects.filter(name=class_name).first() if class_name else None
            room = Room.objects.filter(name=room_name).first() if room_name else None
            if room_name and not room:
                room = Room.objects.create(name=room_name)

            Lesson.objects.create(
                term=term,
                day_of_week=day_of_week,
                start_time=start_time or None,
                end_time=end_time or None,
                start_period=int(start_period) if str(start_period).isdigit() else None,
                end_period=int(end_period) if str(end_period).isdigit() else None,
                week_type='odd' if week_type == '单' else ('even' if week_type == '双' else 'all'),
                weeks=weeks,
                course=course,
                teacher=teacher,
                class_ref=class_obj,
                room=room,
                course_name=course_name,
                teacher_name=teacher_name,
                class_name=class_name,
                room_name=room_name,
                remark=remark,
            )
            created += 1

        return Response({'success': True, 'data': {'created': created}})


def _filter_by_week(qs, week: Optional[str]):
    if not week:
        return qs
    # weeks 字段可能为 "1-16" 或 "1,3,5"，简单包含判断
    return qs.filter(models.Q(weeks__icontains=f',{week},') | models.Q(weeks__startswith=f'{week},') | models.Q(weeks__endswith=f',{week}') | models.Q(weeks=week))


@api_view(['GET'])
def school_timetable(request):
    term = request.query_params.get('term')
    week = request.query_params.get('week')
    qs = Lesson.objects.filter(term=term)
    qs = _filter_by_week(qs, week)
    qs = qs.order_by('day_of_week','start_time','start_period')
    data = LessonSerializer(qs, many=True).data
    return Response({'success': True, 'data': {'lessons': data}})


@api_view(['GET'])
def class_timetable(request, pk):
    term = request.query_params.get('term')
    week = request.query_params.get('week')
    qs = Lesson.objects.filter(term=term, class_ref_id=pk)
    qs = _filter_by_week(qs, week)
    qs = qs.order_by('day_of_week','start_time','start_period')
    data = LessonSerializer(qs, many=True).data
    return Response({'success': True, 'data': {'lessons': data}})


@api_view(['GET'])
def teacher_timetable(request, pk):
    term = request.query_params.get('term')
    week = request.query_params.get('week')
    qs = Lesson.objects.filter(term=term, teacher_id=pk)
    qs = _filter_by_week(qs, week)
    qs = qs.order_by('day_of_week','start_time','start_period')
    data = LessonSerializer(qs, many=True).data
    return Response({'success': True, 'data': {'lessons': data}})


@api_view(['GET'])
def room_timetable(request, pk):
    term = request.query_params.get('term')
    week = request.query_params.get('week')
    qs = Lesson.objects.filter(term=term, room_id=pk)
    qs = _filter_by_week(qs, week)
    qs = qs.order_by('day_of_week','start_time','start_period')
    data = LessonSerializer(qs, many=True).data
    return Response({'success': True, 'data': {'lessons': data}})


@api_view(['GET'])
def timetable_template(request):
    # 生成课程表样式 Excel 模板
    try:
        import openpyxl  # type: ignore
        from openpyxl.styles import Alignment, Font, PatternFill, Border, Side
    except Exception:
        return Response({'success': False, 'error': {'code':'DEPENDENCY_MISSING','message':'服务器缺少 openpyxl 依赖'}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = '课程表模板'

    days = ['星期一','星期二','星期三','星期四','星期五']
    periods = [
        '08:00-08:40','08:50-09:30','大课间 09:30-10:00','10:00-10:40','10:50-11:30','11:40-12:20',
        '午休 12:20-14:20','14:20-15:00','眼保健操 15:00-15:15','15:15-15:55','16:10-16:50','17:05-17:45'
    ]
    mode = request.query_params.get('mode', 'class')  # class: A列为班级；time: A列为时间

    # 列宽设置：第一列更宽显示时间
    ws.column_dimensions['A'].width = 18
    for col in range(2, 2 + 9 * len(days)):
        ws.column_dimensions[openpyxl.utils.get_column_letter(col)].width = 14

    # 顶部第一列标题
    ws.cell(row=1, column=1).value = '班级' if mode == 'class' else '时间/班级'
    ws.merge_cells(start_row=1, start_column=1, end_row=2, end_column=1)
    ws.cell(row=1, column=1).alignment = Alignment(horizontal='center', vertical='center')

    # 第一行：星期（每个星期占 9 列）
    col = 2
    for d in days:
        ws.cell(row=1, column=col).value = d
        ws.merge_cells(start_row=1, start_column=col, end_row=1, end_column=col+8)
        ws.cell(row=1, column=col).alignment = Alignment(horizontal='center', vertical='center')
        col += 9

    # 第二行：上午/下午（上午 1-5，下午 6-9；中间穿插特殊行如大课间、午休、眼保健操，仅作参考，可忽略）
    col = 2
    for _ in days:
        # 上午覆盖前5列
        ws.cell(row=2, column=col).value = '上午'
        ws.merge_cells(start_row=2, start_column=col, end_row=2, end_column=col+4)
        ws.cell(row=2, column=col).alignment = Alignment(horizontal='center', vertical='center')
        # 下午覆盖后4列
        ws.cell(row=2, column=col+5).value = '下午'
        ws.merge_cells(start_row=2, start_column=col+5, end_row=2, end_column=col+8)
        ws.cell(row=2, column=col+5).alignment = Alignment(horizontal='center', vertical='center')
        col += 9

    # 第三行：节次序号 1..9 重复
    green = Font(color='008000', bold=True)
    row_idx = 3
    ws.cell(row=row_idx, column=1).value = ''
    col = 2
    for _ in days:
        for i in range(1, 10):
            c = ws.cell(row=row_idx, column=col)
            c.value = i
            c.alignment = Alignment(horizontal='center', vertical='center')
            c.font = green
            col += 1
    # 数据区从第4行开始
    base_row = 4
    thin = Side(style='thin', color='000000')
    border = Border(top=thin, bottom=thin, left=thin, right=thin)

    if mode == 'class':
        # 从数据库读取班级名称（可选筛选：grade_id、grade_name、status）
        grade_id = request.query_params.get('grade_id')
        grade_name = request.query_params.get('grade_name')
        status_filter = request.query_params.get('status') or '在读'
        try:
            qs = SchoolClass.objects.all()
            if grade_id:
                qs = qs.filter(grade_id=grade_id)
            if grade_name:
                qs = qs.filter(grade__name=grade_name)
            if status_filter:
                qs = qs.filter(status=status_filter)
            class_names = list(qs.order_by('grade__name','name').values_list('name', flat=True))
        except Exception:
            class_names = []

        # 若数据库为空，给出占位示例
        if not class_names:
            class_names = ['一年级1班', '一年级2班', '一年级3班']

        for i, cls in enumerate(class_names):
            r = base_row + i
            ws.cell(row=r, column=1).value = cls
            ws.cell(row=r, column=1).alignment = Alignment(horizontal='center', vertical='center')
            for col in range(2, 2 + 9 * len(days)):
                ws.cell(row=r, column=col).border = border
                ws.cell(row=r, column=col).alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    else:
        # 时间行模板
        for i, p in enumerate(periods):
            r = base_row + i
            ws.cell(row=r, column=1).value = p
            ws.cell(row=r, column=1).alignment = Alignment(horizontal='center', vertical='center')
            for col in range(2, 2 + 9 * len(days)):
                ws.cell(row=r, column=col).border = border
                ws.cell(row=r, column=col).alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

    # 给表头加边框
    for r in range(1, base_row):
        for c in range(1, 2 + 9 * len(days)):
            ws.cell(row=r, column=c).border = border

    bio = io.BytesIO()
    wb.save(bio)
    bio.seek(0)
    resp = HttpResponse(bio.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    resp['Content-Disposition'] = 'attachment; filename="课程表导入模板.xlsx"'
    return resp


