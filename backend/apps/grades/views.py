from django.db.models import Q
from django.utils import timezone
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from apps.common.pagination import BYSSPagination
from apps.grades.models import Exam, Score
from apps.grades.serializers import (
    ExamListSerializer,
    ExamDetailSerializer,
    ScoreListSerializer,
    ScoreDetailSerializer,
)


class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.select_related("grade").all().order_by("-created_at")
    pagination_class = BYSSPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "term", "code", "grade__name"]
    filterset_fields = ["term", "grade"]
    ordering_fields = ["created_at", "exam_date", "name", "term"]

    def get_serializer_class(self):
        if self.action == "list":
            return ExamListSerializer
        return ExamDetailSerializer

    def create(self, request, *args, **kwargs):
        """创建考试，支持年级名称兜底"""
        data = request.data.copy()
        # 兼容前端传入 grade 字符串（年级名）
        if isinstance(data.get('grade'), str) and data.get('grade'):
            data['grade_name_input'] = data.get('grade')
            data.pop('grade')
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            "success": True, 
            "data": serializer.data,
            "timestamp": timezone.now().isoformat()
        })

    def update(self, request, *args, **kwargs):
        """更新考试，支持年级名称兜底"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        if isinstance(data.get('grade'), str) and data.get('grade'):
            data['grade_name_input'] = data.get('grade')
            data.pop('grade')
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            "success": True, 
            "data": serializer.data,
            "timestamp": timezone.now().isoformat()
        })

    @action(detail=False, methods=["get"], url_path="export")
    def export_exams(self, request):
        qs = self.filter_queryset(self.get_queryset())
        rows = ["考试编码,考试名称,学期,年级,考试日期"]
        for e in qs:
            rows.append(f"{e.code},{e.name},{e.term},{e.grade.name},{e.exam_date or ''}")
        csv_content = "\n".join(rows)
        resp = HttpResponse(csv_content, content_type="text/csv; charset=utf-8")
        resp["Content-Disposition"] = 'attachment; filename="exams.csv"'
        return resp


class ScoreViewSet(viewsets.ModelViewSet):
    queryset = (
        Score.objects.select_related("exam", "student", "course", "class_ref")
        .all()
        .order_by("-created_at")
    )
    pagination_class = BYSSPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["student__name", "student__student_id", "course__name", "class_ref__name"]
    filterset_fields = ["exam", "course", "class_ref", "passed"]
    ordering_fields = ["score", "rank_in_class", "rank_in_grade", "created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return ScoreListSerializer
        return ScoreDetailSerializer

    @action(detail=False, methods=["get"], url_path="template")
    def download_template(self, request):
        """下载成绩导入模板（CSV，中文表头）。

        支持两种格式：
        1) 宽表（推荐）：学号,姓名,班级编码,语文,语文排名,道法,道法排名,数学,数学排名,英语,英语排名,历史,历史排名,化学,化学排名,物理,物理排名,体育,体育排名,总分,总分排名
        2) 窄表：学号,姓名,班级,课程,分数,满分
        """
        rows = [
            "学号,姓名,班级编码,语文,语文排名,道法,道法排名,数学,数学排名,英语,英语排名,历史,历史排名,化学,化学排名,物理,物理排名,体育,体育排名,总分,总分排名",
            "20250001,张三,一年级1班,88,12,76,35,92,5,85,10,79,18,83,15,90,7,95,3,708,8",
        ]
        csv_content = "\n".join(rows)
        resp = HttpResponse(csv_content, content_type="text/csv; charset=utf-8")
        resp["Content-Disposition"] = 'attachment; filename="成绩导入模板.csv"'
        return resp

    @action(detail=False, methods=["get"], url_path="export")
    def export_scores(self, request):
        qs = self.filter_queryset(self.get_queryset())
        rows = ["考试,学号,姓名,班级,课程,分数,满分,班内排名,年级排名,是否及格"]
        for s in qs:
            rows.append(
                f"{s.exam.name},{s.student.student_id},{s.student_name},{s.class_name},{s.course_name},{s.score or ''},{s.full_score},{s.rank_in_class or ''},{s.rank_in_grade or ''},{'是' if s.passed else '否'}"
            )
        csv_content = "\n".join(rows)
        resp = HttpResponse(csv_content, content_type="text/csv; charset=utf-8")
        resp["Content-Disposition"] = 'attachment; filename="scores.csv"'
        return resp

    @action(detail=False, methods=["post"], url_path="import", parser_classes=[MultiPartParser])
    def import_scores(self, request):
        file = request.FILES.get("file")
        exam_id = request.data.get("exam_id")
        mode = (request.data.get("mode") or "append").lower()
        class_id_for_overwrite = request.data.get("class_id")
        if not file or not exam_id:
            return Response(
                {
                    "success": False,
                    "error": {"code": "VALIDATION_ERROR", "message": "缺少文件或 exam_id"},
                    "timestamp": timezone.now().isoformat(),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        import csv
        import io

        content = None
        for enc in ["utf-8-sig", "utf-8", "gbk", "gb18030", "cp936"]:
            try:
                content = file.read().decode(enc)
                break
            except Exception:
                file.seek(0)
                continue
        if content is None:
            return Response(
                {
                    "success": False,
                    "error": {"code": "INVALID_FILE", "message": "文件解码失败"},
                    "timestamp": timezone.now().isoformat(),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        def pick(row: dict, keys: list[str]) -> str:
            for k in keys:
                if k in row and row[k]:
                    return str(row[k]).strip()
            return ""

        reader = csv.DictReader(io.StringIO(content))
        fieldnames = [h.strip() for h in (reader.fieldnames or [])]
        created = 0
        from apps.grades.models import Exam
        from apps.students.models import Student
        from apps.courses.models import Course
        from apps.schools.models import Class

        try:
            exam = Exam.objects.get(id=exam_id)
        except Exam.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "error": {"code": "NOT_FOUND", "message": "考试不存在"},
                    "timestamp": timezone.now().isoformat(),
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # 覆盖模式：先清空指定范围的旧数据
        if mode == "overwrite":
            qs_to_delete = Score.objects.filter(exam=exam)
            if class_id_for_overwrite:
                qs_to_delete = qs_to_delete.filter(class_ref_id=class_id_for_overwrite)
            deleted_count, _ = qs_to_delete.delete()

        is_wide = (
            ("course" not in fieldnames) and ("课程" not in fieldnames)
            and any(h in fieldnames for h in ["语文", "数学", "英语", "道法", "历史", "化学", "物理", "体育"])
        )

        if is_wide:
            SUBJECTS = [
                ("语文", "语文排名"),
                ("道法", "道法排名"),
                ("数学", "数学排名"),
                ("英语", "英语排名"),
                ("历史", "历史排名"),
                ("化学", "化学排名"),
                ("物理", "物理排名"),
                ("体育", "体育排名"),
            ]

            for row in reader:
                if not row:
                    continue
                student_id = pick(row, ["student_id", "学号", "学籍号", "学籍编码", "学生编码"]) or ""
                student_name = pick(row, ["student_name", "姓名"]) or ""
                class_code = pick(row, ["class_code", "班级编码"]) or ""
                class_name = pick(row, ["class", "class_name", "班级", "班级名称"]) or ""

                if not (student_id and (class_code or class_name)):
                    continue

                try:
                    student = Student.objects.get(student_id=student_id)
                except Student.DoesNotExist:
                    continue

                if class_code:
                    cls, _ = Class.objects.get_or_create(code=class_code, defaults={"name": class_code, "grade": exam.grade})
                else:
                    cls, _ = Class.objects.get_or_create(name=class_name, defaults={"code": class_name, "grade": exam.grade})

                for subj, rank_header in SUBJECTS:
                    score_str = (row.get(subj) or "").strip()
                    if score_str == "":
                        continue
                    try:
                        score_val = float(score_str)
                    except Exception:
                        score_val = None
                    rank_str = (row.get(rank_header) or "").strip()
                    try:
                        rank_val = int(rank_str) if rank_str != "" else None
                    except Exception:
                        rank_val = None

                    course, _ = Course.objects.get_or_create(
                        code=subj, defaults={"name": subj, "category": "必修", "weekly_hours": 0}
                    )

                    obj, _created = Score.objects.update_or_create(
                        exam=exam,
                        student=student,
                        course=course,
                        defaults={
                            "class_ref": cls,
                            "score": score_val,
                            "full_score": 100,
                            "rank_in_class": rank_val,
                            "student_name": student.name,
                            "class_name": cls.name,
                            "course_name": course.name,
                            "passed": (score_val or 0) >= 60,
                        },
                    )
                    created += 1
            # 宽表中的“总分/总分排名”用于参考，当前不入库
        else:
            for row in reader:
                if not row:
                    continue
                student_id = pick(row, ["student_id", "学号"]) or ""
                student_name = pick(row, ["student_name", "姓名"]) or ""
                class_name = pick(row, ["class", "class_name", "班级"]) or ""
                course_name = pick(row, ["course", "course_name", "课程", "学科"]) or ""
                score_str = pick(row, ["score", "分数"]) or ""
                full_str = pick(row, ["full", "full_score", "满分"]) or "100"

                if not (student_id and course_name and class_name):
                    continue

                try:
                    student = Student.objects.get(student_id=student_id)
                except Student.DoesNotExist:
                    continue

                course, _ = Course.objects.get_or_create(code=course_name, defaults={"name": course_name, "category": "必修", "weekly_hours": 0})
                cls, _ = Class.objects.get_or_create(name=class_name, defaults={"code": class_name, "grade": exam.grade})

                try:
                    score_val = float(score_str) if score_str != "" else None
                except Exception:
                    score_val = None
                try:
                    full_val = float(full_str) if full_str != "" else 100
                except Exception:
                    full_val = 100

                obj, _created = Score.objects.update_or_create(
                    exam=exam,
                    student=student,
                    course=course,
                    defaults={
                        "class_ref": cls,
                        "score": score_val,
                        "full_score": full_val,
                        "student_name": student.name,
                        "class_name": cls.name,
                        "course_name": course.name,
                        "passed": (score_val or 0) >= max(60, (full_val or 100) * 0.6),
                    },
                )
                created += 1

        return Response({"success": True, "data": {"created": created}, "timestamp": timezone.now().isoformat()})

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """按学生汇总各学科成绩与排名（默认班内排名，可用 rank=grade 切换年级排名）。

        查询参数：
        - exam: 必填，考试ID
        - class_ref: 可选，按班级过滤
        - rank: 可选，class|grade（默认 class）
        - search: 可选，按学号/姓名模糊过滤
        """
        exam_id = request.query_params.get("exam")
        if not exam_id:
            return Response(
                {
                    "success": False,
                    "error": {"code": "VALIDATION_ERROR", "message": "exam 必填"},
                    "timestamp": timezone.now().isoformat(),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        rank_mode = (request.query_params.get("rank") or "class").lower()
        allowed_modes = {"class", "grade"}
        if rank_mode not in allowed_modes:
            rank_mode = "class"

        qs = self.get_queryset().filter(exam_id=exam_id)
        class_ref = request.query_params.get("class_ref")
        if class_ref:
            qs = qs.filter(class_ref_id=class_ref)

        search = (request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(student__student_id__icontains=search)
                | Q(student__name__icontains=search)
            )

        # 映射课程名称到学科键
        SUBJECT_MAP = {
            "语文": "chinese",
            "数学": "math",
            "英语": "english",
            "道法": "daofa",
            "道德与法治": "daofa",
            "思想品德": "daofa",
            "历史": "history",
            "物理": "physics",
            "化学": "chemistry",
            "地理": "geography",
            "生物": "biology",
        }

        rows: dict[str, dict] = {}
        for s in qs:
            sid = str(s.student_id)
            if sid not in rows:
                rows[sid] = {
                    "id": str(s.student_id),
                    "studentId": s.student.student_id,
                    "studentName": s.student_name or s.student.name,
                    "className": s.class_name or s.class_ref.name,
                    # 预设键，默认 None
                    "chinese": None, "chineseRank": None,
                    "math": None, "mathRank": None,
                    "english": None, "englishRank": None,
                    "daofa": None, "daofaRank": None,
                    "history": None, "historyRank": None,
                    "physics": None, "physicsRank": None,
                    "chemistry": None, "chemistryRank": None,
                    "geography": None, "geographyRank": None,
                    "biology": None, "biologyRank": None,
                }
            course_name = (s.course_name or s.course.name).strip()
            key = SUBJECT_MAP.get(course_name)
            if not key:
                continue
            rows[sid][key] = float(s.score) if s.score is not None else None
            rows[sid][f"{key}Rank"] = (
                s.rank_in_class if rank_mode == "class" else s.rank_in_grade
            )

        data = list(rows.values())
        # 计算总分与排名
        SUBJECT_KEYS = [
            "chinese",
            "math",
            "english",
            "daofa",
            "history",
            "physics",
            "chemistry",
            "geography",
            "biology",
        ]
        for r in data:
            total = 0.0
            has_val = False
            for k in SUBJECT_KEYS:
                v = r.get(k)
                if v is not None:
                    total += float(v)
                    has_val = True
            r["total"] = round(total, 2) if has_val else None

        # 分组计算排名：按班级或全年级
        from collections import defaultdict
        groups: dict[str, list] = defaultdict(list)
        for r in data:
            key = r.get("className") or "all" if rank_mode == "class" else "all"
            if rank_mode == "class":
                key = r.get("className") or "all"
            else:
                key = "all"
            groups[key].append(r)

        for g_rows in groups.values():
            g_rows.sort(key=lambda x: (x.get("total") is None, -(x.get("total") or 0)))
            last_score = None
            last_rank = 0
            i = 0
            for r in g_rows:
                i += 1
                score = r.get("total")
                if score is None:
                    r["totalRank"] = None
                    continue
                if score != last_score:
                    last_rank = i
                    last_score = score
                r["totalRank"] = last_rank

        # 总体排序：先按班级、再按学号
        data.sort(key=lambda x: (x.get("className") or "", x.get("studentId") or ""))
        return Response({"success": True, "data": {"results": data}, "timestamp": timezone.now().isoformat()})



    @action(detail=False, methods=["get"], url_path="analytics")
    def analytics(self, request):
        """按 班级×科目 统计一分四率（优秀率/良好率/低分率/超均率）。

        查询参数：
        - exam: 必填，考试ID
        - class_ref: 可选，只统计指定班级
        - course: 可选，只统计指定科目
        - excellent: 优秀阈值（满分比例，默认 0.9）
        - good: 良好阈值（满分比例，默认 0.8；小于优秀阈值）
        - low: 低分阈值（满分比例，默认 0.6）
        - baseline: 超均率参考基线，固定 exam（整场考试的年级均分）

        说明：
        - 阈值均以每条记录自己的满分 full_score 为基准。
        - 超均率：班级内该科成绩 > 年级（本次考试）该科平均分 的人数占比。
        """
        exam_id = request.query_params.get("exam")
        if not exam_id:
            return Response(
                {
                    "success": False,
                    "error": {"code": "VALIDATION_ERROR", "message": "exam 必填"},
                    "timestamp": timezone.now().isoformat(),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 解析阈值（比例 0~1）
        def _get_ratio(name: str, default: float) -> float:
            try:
                v = float(request.query_params.get(name, default))
                if v < 0:
                    v = 0.0
                if v > 1:
                    # 若传入 60、80、90 这类百分数，转换为比例
                    v = v / 100.0
                return v
            except Exception:
                return default

        excellent_ratio = _get_ratio("excellent", 0.9)
        good_ratio = _get_ratio("good", 0.8)
        low_ratio = _get_ratio("low", 0.6)

        # 计算整场考试（年级）层面的科目平均分，作为超均率的基线
        exam_all_qs = (
            Score.objects.filter(exam_id=exam_id, score__isnull=False)
            .select_related("course")
            .only("course_id", "score")
        )
        course_sum: dict[str, float] = {}
        course_cnt: dict[str, int] = {}
        course_name_by_id: dict[str, str] = {}
        for s in exam_all_qs:
            cid = str(s.course_id)
            course_sum[cid] = course_sum.get(cid, 0.0) + float(s.score)
            course_cnt[cid] = course_cnt.get(cid, 0) + 1
            if cid not in course_name_by_id:
                course_name_by_id[cid] = s.course.name if getattr(s, "course", None) else ""
        course_avg: dict[str, float] = {
            cid: (course_sum[cid] / course_cnt[cid]) for cid in course_sum.keys() if course_cnt.get(cid)
        }

        # 过滤统计集（可选班级/科目）
        qs = (
            Score.objects.filter(exam_id=exam_id)
            .select_related("class_ref", "course")
            .only("class_ref_id", "course_id", "score", "full_score")
        )
        class_ref = request.query_params.get("class_ref")
        if class_ref:
            qs = qs.filter(class_ref_id=class_ref)
        course = request.query_params.get("course")
        if course:
            qs = qs.filter(course_id=course)

        # 按 班级×科目 聚合
        from collections import defaultdict

        groups = defaultdict(lambda: {
            "class_id": None,
            "class_name": None,
            "course_id": None,
            "course_name": None,
            "valid_count": 0,
            "excellent": 0,
            "good": 0,
            "low": 0,
            "above_avg": 0,
            "sum_score": 0.0,
        })

        for s in qs:
            key = (str(s.class_ref_id), str(s.course_id))
            g = groups[key]
            if g["class_id"] is None:
                g["class_id"] = str(s.class_ref_id)
                g["course_id"] = str(s.course_id)
                # 懒取名称，避免额外查询
                g["class_name"] = s.class_ref.name if getattr(s, "class_ref", None) else ""
                # 优先从预存名称表取，兜底 model name
                g["course_name"] = course_name_by_id.get(str(s.course_id)) or (s.course.name if getattr(s, "course", None) else "")

            # 仅对有分数的记录计入分母与分类
            if s.score is None:
                continue
            score_val = float(s.score)
            full_val = float(s.full_score or 100)
            g["valid_count"] += 1
            g["sum_score"] += score_val

            if score_val >= excellent_ratio * full_val:
                g["excellent"] += 1
            elif score_val >= good_ratio * full_val:
                g["good"] += 1
            if score_val < low_ratio * full_val:
                g["low"] += 1

            avg_grade = course_avg.get(str(s.course_id))
            if avg_grade is not None and score_val > avg_grade:
                g["above_avg"] += 1

        # 构造返回
        results = []
        for g in groups.values():
            denom = g["valid_count"] or 1
            class_avg = (g["sum_score"] / denom) if g["valid_count"] else None
            grade_avg = course_avg.get(g["course_id"]) if g["course_id"] in course_avg else None
            results.append({
                "classId": g["class_id"],
                "className": g["class_name"] or "",
                "courseId": g["course_id"],
                "courseName": g["course_name"] or "",
                "sampleSize": g["valid_count"],
                "excellentRate": round(g["excellent"] * 100.0 / denom, 2) if g["valid_count"] else 0.0,
                "goodRate": round(g["good"] * 100.0 / denom, 2) if g["valid_count"] else 0.0,
                "lowRate": round(g["low"] * 100.0 / denom, 2) if g["valid_count"] else 0.0,
                "aboveAvgRate": round(g["above_avg"] * 100.0 / denom, 2) if g["valid_count"] else 0.0,
                "classAvgScore": round(class_avg, 2) if class_avg is not None else None,
                "gradeAvgScore": round(grade_avg, 2) if grade_avg is not None else None,
            })

        # 排序：按班级、科目
        results.sort(key=lambda r: ((r.get("className") or ""), (r.get("courseName") or "")))

        return Response({
            "success": True,
            "data": {"results": results},
            "timestamp": timezone.now().isoformat(),
        })
