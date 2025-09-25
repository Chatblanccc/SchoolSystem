import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectItem } from "@/components/ui/select"
import { gradeService } from "@/services/gradeService"
import { classService } from "@/services/classService"
import { useToast } from "@/hooks/use-toast"
import dayjs from "dayjs"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const schema = z
  .object({
    code: z.string().min(2, "请输入考试编码").max(64),
    name: z.string().min(2, "请输入考试名称").max(128),
    term: z.string().min(2, "请输入学期，如 2025-上").max(32),
    examDate: z.string().optional(),
    gradeNameInput: z.string().optional(),
    remark: z.string().optional(),
  })

type FormData = z.infer<typeof schema>

export default function ExamCreate() {
  const { toast } = useToast()
  const [gradeNameOptions, setGradeNameOptions] = useState<string[]>([])
  const [loadingGrades, setLoadingGrades] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      name: "",
      term: "",
      examDate: "",
      gradeNameInput: "",
      remark: "",
    },
  })

  const term = watch("term")

  useEffect(() => {
    ;(async () => {
      setLoadingGrades(true)
      try {
        const res = await classService.getClasses({ page: 1, pageSize: 500 })
        const set = new Set<string>()
        res.classes.forEach(c => {
          if (c.grade) set.add(c.grade)
        })
        setGradeNameOptions(Array.from(set))
      } catch (e) {
        // ignore
      } finally {
        setLoadingGrades(false)
      }
    })()
  }, [])

  const quickTerms = useMemo(() => {
    const year = dayjs().year()
    return [
      `${year}-上`, `${year}-下`, `${year - 1}-上`, `${year - 1}-下`,
    ]
  }, [])

  const generateCode = () => {
    const ts = dayjs().format("YYYYMMDDHHmmss")
    const t = (term || "exam").replace(/\s+/g, "-")
    setValue("code", `${t}-${ts}`)
  }

  const onSubmit = async (values: FormData) => {
    try {
      const created = await gradeService.createExam({
        code: values.code.trim(),
        name: values.name.trim(),
        term: values.term.trim(),
        examDate: values.examDate || undefined,
        remark: values.remark || undefined,
        gradeNameInput: (values.gradeNameInput || "").trim() || undefined,
      })
      toast({ title: "创建成功", description: `${created.name}（${created.term}）` })
      reset()
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('createExam error', err?.response?.data || err)
      const raw = err?.response?.data?.error?.message ?? err?.message ?? err
      const msg = typeof raw === 'string' ? raw : JSON.stringify(raw)
      toast({ title: "创建失败", description: msg, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">考试创建</div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">考试编码</div>
              <Button type="button" size="sm" variant="secondary" onClick={generateCode}>一键生成</Button>
            </div>
            <Input placeholder="如 2025-midterm-01" {...register("code")} />
            {errors.code && <div className="text-xs text-destructive">{errors.code.message}</div>}
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">考试名称</div>
            <Input placeholder="如 2025学年上学期月考" {...register("name")} />
            {errors.name && <div className="text-xs text-destructive">{errors.name.message}</div>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">学期</div>
              <div className="flex items-center gap-2">
                {quickTerms.map(t => (
                  <Button type="button" key={t} size="sm" variant="outline" onClick={() => setValue("term", t)}>{t}</Button>
                ))}
              </div>
            </div>
            <Input placeholder="如 2025-上" {...register("term")} />
            {errors.term && <div className="text-xs text-destructive">{errors.term.message}</div>}
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">考试日期（可选）</div>
            <Input type="date" {...register("examDate")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="text-sm text-muted-foreground">所属年级（可直接输入，或从建议中选择）</div>
            <div className="flex gap-2 flex-wrap">
              <div className="min-w-[200px]">
                <Select placeholder="选择年级（建议）" value={watch("gradeNameInput") || ''} onValueChange={(v) => setValue("gradeNameInput", v)} className="w-full">
                  <SelectItem value="">未选择</SelectItem>
                  {gradeNameOptions.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </Select>
              </div>
              <div className="flex-1 min-w-[240px]">
                <Input placeholder="或直接输入年级名称，如 一年级" {...register("gradeNameInput")} />
              </div>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="text-sm text-muted-foreground">备注（可选）</div>
            <Input placeholder="备注信息" {...register("remark")} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? '提交中...' : '创建考试'}</Button>
          {loadingGrades && <div className="text-xs text-muted-foreground">正在载入年级建议...</div>}
          <div className="text-xs text-muted-foreground">提示：年级名称与学校“年级/班级”模块一致。</div>
        </div>
      </form>
    </div>
  )
}


