// ============================================================
// 模拟数据生成脚本
// 生成: 3学院 6专业 300学生 80岗位 50企业 600+投递 100+面试 80+沟通 30+任务
// 包含案例 A-F
// ============================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 确定性随机
let seed = 42;
function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
function randInt(min: number, max: number) { return Math.floor(rand() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function pickSome<T>(arr: T[], n: number): T[] { return [...arr].sort(() => rand() - 0.5).slice(0, n); }

const surnames = "赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎";
const givenNames = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋", "勇", "艳", "杰", "娟", "涛", "明", "超", "秀英", "霞", "平", "刚", "桂英", "玲", "婷", "恒", "宇", "辉", "琳", "晓东", "晨", "雪", "佳", "鑫", "波", "斌", "博", "诚", "达", "飞", "刚"];

function genName() {
  const surname = surnames[Math.floor(rand() * surnames.length)];
  const given = rand() > 0.4 ? pick(givenNames) : pick(givenNames) + pick(givenNames);
  return surname + given;
}

const cities = ["北京", "上海", "广州", "深圳", "杭州", "成都", "南京", "武汉", "西安", "长沙", "苏州", "重庆", "天津"];
const skillsMap: Record<string, string[]> = {
  "计算机科学与技术": ["Java", "Python", "C++", "算法", "数据结构", "MySQL", "Linux", "Git", "Spring Boot", "React", "Vue", "Docker"],
  "软件工程": ["Java", "TypeScript", "React", "Node.js", "Spring Boot", "MySQL", "Git", "Docker", "微服务", "AWS"],
  "网络工程": ["网络安全", "Linux", "路由交换", "Wireshark", "防火墙", "Python", "运维", "Shell", "Nginx", "服务器"],
  "电子信息工程": ["嵌入式", "C语言", "STM32", "PCB", "信号处理", "MATLAB", "Verilog", "FPGA"],
  "通信工程": ["5G", "信号处理", "MATLAB", "通信原理", "Python", "RF", "天线设计"],
  "人工智能": ["Python", "PyTorch", "TensorFlow", "机器学习", "深度学习", "NLP", "计算机视觉", "算法"],
};

const enterprises = [
  { name: "腾讯科技(深圳)有限公司", industry: "互联网" },
  { name: "阿里巴巴集团控股有限公司", industry: "互联网" },
  { name: "字节跳动科技有限公司", industry: "互联网" },
  { name: "百度在线网络技术公司", industry: "互联网" },
  { name: "华为技术有限公司", industry: "通信" },
  { name: "中兴通讯股份有限公司", industry: "通信" },
  { name: "中国电信集团有限公司", industry: "通信" },
  { name: "中国移动通信集团", industry: "通信" },
  { name: "京东集团股份有限公司", industry: "电商" },
  { name: "美团科技有限公司", industry: "互联网" },
  { name: "网易公司", industry: "互联网" },
  { name: "拼多多公司", industry: "电商" },
  { name: "滴滴出行科技有限公司", industry: "出行" },
  { name: "小米科技有限责任公司", industry: "智能硬件" },
  { name: "大疆创新科技有限公司", industry: "智能硬件" },
  { name: "比亚迪股份有限公司", industry: "汽车" },
  { name: "宁德时代新能源科技", industry: "新能源" },
  { name: "中芯国际集成电路制造", industry: "半导体" },
  { name: "京东方科技集团", industry: "半导体" },
  { name: "紫光集团", industry: "半导体" },
  { name: "海康威视数字技术", industry: "安防" },
  { name: "大华技术股份", industry: "安防" },
  { name: "科大讯飞股份", industry: "人工智能" },
  { name: "商汤科技", industry: "人工智能" },
  { name: "旷视科技", industry: "人工智能" },
  { name: "深信服科技", industry: "网络安全" },
  { name: "奇安信科技", industry: "网络安全" },
  { name: "绿盟科技", industry: "网络安全" },
  { name: "用友网络科技", industry: "企业服务" },
  { name: "金蝶软件", industry: "企业服务" },
  { name: "帆软软件", industry: "企业服务" },
  { name: "恒生电子", industry: "金融科技" },
  { name: "同花顺", industry: "金融科技" },
  { name: "蚂蚁集团", industry: "金融科技" },
  { name: "微众银行", industry: "金融科技" },
  { name: "中国银行软件中心", industry: "金融科技" },
  { name: "招商银行信用卡中心", industry: "金融科技" },
  { name: "顺丰科技", industry: "物流科技" },
  { name: "菜鸟网络", industry: "物流科技" },
  { name: "联想集团", industry: "智能硬件" },
  { name: "海尔智家", industry: "智能硬件" },
  { name: "中兴微电子", industry: "半导体" },
  { name: "展锐通信", industry: "半导体" },
  { name: "国家电网信息通信", industry: "能源" },
  { name: "南方电网数字电网", industry: "能源" },
  { name: "中国电子科技集团", industry: "国防" },
  { name: "航天信息股份", industry: "国防" },
  { name: "东方财富信息", industry: "金融科技" },
  { name: "第四范式", industry: "人工智能" },
];

const jobTemplates = [
  { title: "Java后端开发工程师", degreeReq: "bachelor", majorReq: "计算机科学与技术,软件工程", skillReq: ["Java", "Spring Boot", "MySQL"], salary: "10k-18k" },
  { title: "前端开发工程师", degreeReq: "bachelor", majorReq: "计算机科学与技术,软件工程", skillReq: ["React", "TypeScript", "Vue"], salary: "10k-16k" },
  { title: "算法工程师", degreeReq: "master", majorReq: "计算机科学与技术,人工智能", skillReq: ["Python", "PyTorch", "机器学习"], salary: "18k-30k" },
  { title: "算法工程师(本科)", degreeReq: "bachelor", majorReq: "计算机科学与技术,人工智能", skillReq: ["Python", "机器学习"], salary: "12k-20k" },
  { title: "网络安全工程师", degreeReq: "bachelor", majorReq: "网络工程,计算机科学与技术", skillReq: ["网络安全", "Linux"], salary: "9k-15k" },
  { title: "运维工程师", degreeReq: "bachelor", majorReq: "网络工程,计算机科学与技术", skillReq: ["Linux", "Docker", "Nginx"], salary: "8k-14k" },
  { title: "技术支持工程师", degreeReq: "bachelor", majorReq: "网络工程,电子信息工程", skillReq: ["Linux", "路由交换"], salary: "7k-12k" },
  { title: "嵌入式开发工程师", degreeReq: "bachelor", majorReq: "电子信息工程,通信工程", skillReq: ["嵌入式", "C语言", "STM32"], salary: "9k-15k" },
  { title: "通信工程师", degreeReq: "bachelor", majorReq: "通信工程,电子信息工程", skillReq: ["5G", "通信原理"], salary: "8k-14k" },
  { title: "产品经理", degreeReq: "bachelor", majorReq: "", skillReq: [], salary: "10k-18k" },
  { title: "数据分析工程师", degreeReq: "bachelor", majorReq: "计算机科学与技术,人工智能", skillReq: ["Python", "SQL"], salary: "10k-16k" },
  { title: "测试工程师", degreeReq: "bachelor", majorReq: "计算机科学与技术,软件工程", skillReq: ["Python", "自动化测试"], salary: "8k-13k" },
  { title: "AI视觉工程师", degreeReq: "master", majorReq: "人工智能,计算机科学与技术", skillReq: ["PyTorch", "计算机视觉", "深度学习"], salary: "20k-35k" },
  { title: "后端架构师", degreeReq: "master", majorReq: "计算机科学与技术,软件工程", skillReq: ["Java", "微服务", "分布式"], salary: "25k-40k" },
  { title: "FPGA工程师", degreeReq: "bachelor", majorReq: "电子信息工程,通信工程", skillReq: ["Verilog", "FPGA"], salary: "10k-18k" },
  { title: "全栈开发工程师", degreeReq: "bachelor", majorReq: "计算机科学与技术,软件工程", skillReq: ["React", "Node.js", "MySQL"], salary: "12k-20k" },
];

async function main() {
  console.log("开始生成模拟数据...");

  // 清空
  await prisma.helpAction.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.agentLog.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.task.deleteMany();
  await prisma.communication.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.enterprise.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.major.deleteMany();
  await prisma.college.deleteMany();
  console.log("已清空旧数据");

  // ---- 学院和专业 ----
  const colleges = await Promise.all([
    prisma.college.create({ data: { name: "计算机学院", code: "CS" } }),
    prisma.college.create({ data: { name: "电子信息学院", code: "EE" } }),
    prisma.college.create({ data: { name: "通信工程学院", code: "COMM" } }),
  ]);

  const majorDefs = [
    { name: "计算机科学与技术", code: "CS01", collegeId: colleges[0].id },
    { name: "软件工程", code: "CS02", collegeId: colleges[0].id },
    { name: "网络工程", code: "CS03", collegeId: colleges[0].id },
    { name: "电子信息工程", code: "EE01", collegeId: colleges[1].id },
    { name: "通信工程", code: "COMM01", collegeId: colleges[2].id },
    { name: "人工智能", code: "CS04", collegeId: colleges[0].id },
  ];
  const majors = await Promise.all(majorDefs.map((m) => prisma.major.create({ data: m })));

  // ---- 用户 ----
  const users = await Promise.all([
    prisma.user.create({ data: { name: "管理员张老师", role: "admin", collegeId: null } }),
    prisma.user.create({ data: { name: "计算机辅导员李老师", role: "counselor", collegeId: colleges[0].id } }),
    prisma.user.create({ data: { name: "电信辅导员王老师", role: "counselor", collegeId: colleges[1].id } }),
    prisma.user.create({ data: { name: "通信辅导员刘老师", role: "counselor", collegeId: colleges[2].id } }),
    prisma.user.create({ data: { name: "计算机学院赵院长", role: "leader", collegeId: colleges[0].id } }),
  ]);

  // ---- 企业 ----
  const enterpriseRecords = await Promise.all(
    enterprises.map((e) => prisma.enterprise.create({ data: { name: e.name, industry: e.industry, city: pick(cities), scale: pick(["50-100人", "100-500人", "500-1000人", "1000-5000人", "5000人以上"]) } }))
  );

  // ---- 岗位 ----
  const jobs: any[] = [];
  for (let i = 0; i < 80; i++) {
    const ent = pick(enterpriseRecords);
    const tmpl = pick(jobTemplates);
    const city = pick(cities);
    const deadline = new Date(Date.now() + randInt(10, 90) * 86400000);
    const job = await prisma.job.create({
      data: {
        enterpriseId: ent.id,
        title: tmpl.title,
        city,
        degreeReq: tmpl.degreeReq,
        majorReq: tmpl.majorReq || null,
        skillReq: JSON.stringify(tmpl.skillReq),
        salaryRange: tmpl.salary,
        deadline,
        headcount: randInt(1, 5),
        status: rand() > 0.1 ? "open" : "closed",
        certReq: rand() > 0.8 ? "相关职业资格证书" : null,
      },
    });
    jobs.push(job);
  }
  console.log(`生成 ${jobs.length} 个岗位`);

  // ---- 学生 ----
  const studentList: any[] = [];
  const graduateDate = new Date("2025-06-30");
  for (let i = 0; i < 300; i++) {
    const major = pick(majors);
    const collegeId = major.collegeId;
    const degreeLevel = rand() > 0.7 ? "master" : "bachelor";
    const skills = skillsMap[major.name] || ["Python", "Git"];
    const studentSkills = pickSome(skills, randInt(3, 6));
    const counselorId = users.filter((u) => u.role === "counselor" && u.collegeId === collegeId)[0]?.id || users[1].id;

    // 就业状态分布：约50%未落实，30%已就业，10%升学，5%入伍，3%创业，2%出国
    const statusRand = rand();
    let employmentStatus: string;
    if (statusRand < 0.50) employmentStatus = "unplaced";
    else if (statusRand < 0.80) employmentStatus = "employed";
    else if (statusRand < 0.90) employmentStatus = "postgrad";
    else if (statusRand < 0.95) employmentStatus = "military";
    else if (statusRand < 0.98) employmentStatus = "entrepreneurship";
    else employmentStatus = "abroad";

    const lastActivityDaysAgo = employmentStatus === "unplaced" ? randInt(1, 80) : randInt(1, 30);
    const lastActivityAt = new Date(Date.now() - lastActivityDaysAgo * 86400000);

    const intendedCity = rand() > 0.2 ? pickSome(cities, randInt(1, 3)).join(",") : null;
    const intendedRole = rand() > 0.2 ? pick(jobTemplates).title : null;
    const intendedSalary = rand() > 0.3 ? `${randInt(6, 15)}k-${randInt(12, 25)}k` : null;
    const industryPref = rand() > 0.5 ? pick(["互联网", "通信", "金融科技", "人工智能", "网络安全"]) : null;

    const resumeText = `本科就读于${major.name}专业，掌握${studentSkills.join("、")}等技能。参与过课程设计和实验项目，具有良好的编程基础和团队协作能力。`;
    const resumeScore = randInt(35, 85);

    const financialRand = rand();
    const financialStatus = financialRand < 0.7 ? "normal" : financialRand < 0.9 ? "difficulty" : "poverty";

    const student = await prisma.student.create({
      data: {
        studentNo: `2025${String(i + 1).padStart(6, "0")}`,
        name: genName(),
        gender: rand() > 0.5 ? "男" : "女",
        collegeId,
        majorId: major.id,
        degreeLevel,
        grade: "2025届",
        phone: `1${randInt(30, 89)}${String(randInt(10000000, 99999999))}`,
        email: `student${i + 1}@example.edu.cn`,
        employmentStatus,
        statusUpdatedAt: new Date(),
        intendedCity, intendedSalary, intendedRole, industryPref,
        financialStatus,
        resumeText,
        resumeScore,
        skills: JSON.stringify(studentSkills),
        riskLevel: "none",
        lastActivityAt,
        activityLevel: lastActivityDaysAgo <= 7 ? "active" : lastActivityDaysAgo <= 21 ? "normal" : lastActivityDaysAgo <= 45 ? "inactive" : "silent",
        graduateDate,
        counselorId,
        isFictional: true,
      },
    });
    studentList.push(student);
  }
  console.log(`生成 ${studentList.length} 名学生`);

  // ---- 构造演示案例 ----
  // 案例A：本科投递硕士算法岗，20次无面试
  {
    const s = studentList.find((s) => s.degreeLevel === "bachelor" && s.employmentStatus === "unplaced");
    if (s) {
      const algoMasterJobs = jobs.filter((j) => j.title.includes("算法") && j.degreeReq === "master");
      for (let k = 0; k < 20 && k < algoMasterJobs.length; k++) {
        await prisma.application.create({
          data: { studentId: s.id, jobId: algoMasterJobs[k].id, status: "rejected", appliedAt: new Date(Date.now() - randInt(5, 60) * 86400000) },
        });
      }
      await prisma.student.update({ where: { id: s.id }, data: { name: s.name + "(案例A)", intendedRole: "算法工程师", lastActivityAt: new Date(Date.now() - 5 * 86400000) } });
      console.log("案例A已构造");
    }
  }

  // 案例B：技术好但简历差
  {
    const s = studentList.find((s) => s.employmentStatus === "unplaced" && s.resumeScore < 45);
    if (s) {
      const goodJobs = jobs.filter((j) => j.degreeReq === "bachelor").slice(0, 8);
      for (const j of goodJobs) {
        const passed = rand() > 0.3;
        await prisma.application.create({ data: { studentId: s.id, jobId: j.id, status: passed ? "interview" : "viewed", appliedAt: new Date(Date.now() - randInt(3, 30) * 86400000) } });
        if (passed) {
          await prisma.interview.create({ data: { studentId: s.id, jobId: j.id, result: rand() > 0.5 ? "passed" : "failed", round: 1, date: new Date(Date.now() - randInt(1, 15) * 86400000) } });
        }
      }
      await prisma.student.update({ where: { id: s.id }, data: { name: s.name + "(案例B)", resumeText: "简历内容简短。", resumeScore: 35, skills: JSON.stringify(["Java", "Spring Boot", "MySQL", "Redis", "Docker", "微服务"]) } });
      console.log("案例B已构造");
    }
  }

  // 案例C：60天无投递，辅导员联系未回复
  {
    const s = studentList.find((s) => s.employmentStatus === "unplaced" && s.lastActivityAt && new Date(s.lastActivityAt).getTime() < Date.now() - 50 * 86400000);
    if (s) {
      await prisma.student.update({ where: { id: s.id }, data: { name: s.name + "(案例C)", lastActivityAt: new Date(Date.now() - 65 * 86400000), activityLevel: "silent", financialStatus: "difficulty" } });
      for (let k = 0; k < 3; k++) {
        await prisma.communication.create({ data: { studentId: s.id, counselorId: s.counselorId, type: pick(["phone", "wechat"]), content: `第${k + 1}次联系学生，未回复`, result: "未接通/未回复", date: new Date(Date.now() - (40 - k * 10) * 86400000) } });
      }
      console.log("案例C已构造");
    }
  }

  // 案例D：网络工程投产品经理
  {
    const netMajor = majors.find((m) => m.name === "网络工程");
    const s = studentList.find((s) => s.majorId === netMajor?.id && s.employmentStatus === "unplaced");
    if (s) {
      const pmJobs = jobs.filter((j) => j.title.includes("产品经理"));
      for (const j of pmJobs.slice(0, 6)) {
        await prisma.application.create({ data: { studentId: s.id, jobId: j.id, status: pick(["viewed", "rejected"]), appliedAt: new Date(Date.now() - randInt(5, 30) * 86400000) } });
      }
      await prisma.student.update({ where: { id: s.id }, data: { name: s.name + "(案例D)", intendedRole: "产品经理", skills: JSON.stringify(["网络安全", "Linux", "路由交换", "Wireshark", "防火墙", "Python"]) } });
      console.log("案例D已构造");
    }
  }

  // 案例E：多次面试未通过
  {
    const s = studentList.find((s) => s.employmentStatus === "unplaced" && s.lastActivityAt && new Date(s.lastActivityAt).getTime() > Date.now() - 10 * 86400000);
    if (s) {
      const goodJobs = jobs.filter((j) => j.degreeReq === "bachelor").slice(10, 16);
      for (const j of goodJobs) {
        await prisma.application.create({ data: { studentId: s.id, jobId: j.id, status: "interview", appliedAt: new Date(Date.now() - randInt(5, 25) * 86400000) } });
        await prisma.interview.create({ data: { studentId: s.id, jobId: j.id, result: "failed", round: randInt(1, 2), date: new Date(Date.now() - randInt(2, 20) * 86400000) } });
      }
      await prisma.student.update({ where: { id: s.id }, data: { name: s.name + "(案例E)" } });
      console.log("案例E已构造");
    }
  }

  // 案例F：已录用但状态未更新
  {
    const s = studentList.find((s) => s.employmentStatus === "unplaced" && !s.name.includes("案例"));
    if (s) {
      const j = pick(jobs);
      await prisma.application.create({ data: { studentId: s.id, jobId: j.id, status: "offered", appliedAt: new Date(Date.now() - 30 * 86400000) } });
      await prisma.interview.create({ data: { studentId: s.id, jobId: j.id, result: "passed", round: 2, date: new Date(Date.now() - 10 * 86400000) } });
      await prisma.student.update({ where: { id: s.id }, data: { name: s.name + "(案例F)" } });
      console.log("案例F已构造");
    }
  }

  // ---- 生成投递记录 ----
  let appCount = 0;
  for (const s of studentList) {
    if (s.name.includes("案例")) continue; // 案例学生已生成投递
    const numApps = s.employmentStatus === "unplaced" ? randInt(0, 15) : randInt(1, 8);
    const selectedJobs = pickSome(jobs, numApps);
    for (const j of selectedJobs) {
      const status = s.employmentStatus === "employed" && rand() > 0.7 ? "offered" : pick(["submitted", "viewed", "rejected", "interview"]);
      await prisma.application.create({ data: { studentId: s.id, jobId: j.id, status, appliedAt: new Date(Date.now() - randInt(1, 70) * 86400000) } });
      appCount++;
    }
  }
  console.log(`生成 ${appCount} 条投递记录`);

  // ---- 生成面试记录 ----
  const interviewApps = await prisma.application.findMany({ where: { status: { in: ["interview", "offered"] } } });
  let intCount = 0;
  for (const a of interviewApps) {
    if (rand() > 0.4) {
      await prisma.interview.create({ data: { studentId: a.studentId, jobId: a.jobId, result: a.status === "offered" ? "passed" : pick(["passed", "failed"]), round: randInt(1, 3), date: new Date(Date.now() - randInt(1, 30) * 86400000) } });
      intCount++;
    }
  }
  console.log(`生成 ${intCount} 条面试记录`);

  // ---- 生成沟通记录 ----
  let commCount = 0;
  const counselors = users.filter((u) => u.role === "counselor");
  for (const c of counselors) {
    const cStudents = studentList.filter((s) => s.counselorId === c.id);
    for (const s of pickSome(cStudents, Math.min(20, cStudents.length))) {
      const numComms = randInt(1, 3);
      for (let k = 0; k < numComms; k++) {
        await prisma.communication.create({
          data: {
            studentId: s.id, counselorId: c.id, type: pick(["phone", "wechat", "inperson"]),
            content: pick(["了解学生求职进展", "督促学生投递简历", "沟通岗位推荐", "面试辅导安排"]),
            result: pick(["学生表示积极求职中", "学生反馈求职困难", "已安排模拟面试", "学生未回复"]),
            date: new Date(Date.now() - randInt(1, 40) * 86400000),
          },
        });
        commCount++;
      }
    }
  }
  console.log(`生成 ${commCount} 条沟通记录`);

  // ---- 生成帮扶任务 ----
  let taskCount = 0;
  for (const c of counselors) {
    const cStudents = studentList.filter((s) => s.counselorId === c.id);
    for (const s of pickSome(cStudents, Math.min(12, cStudents.length))) {
      const types = ["interview", "resume", "recommend", "mock_interview", "goal_adjust", "follow_up"];
      await prisma.task.create({
        data: {
          studentId: s.id, ownerId: c.id, type: pick(types),
          priority: pick(["low", "medium", "high"]),
          deadline: new Date(Date.now() + randInt(3, 20) * 86400000),
          action: pick(["安排一对一面谈", "指导简历优化", "推荐匹配岗位", "安排模拟面试", "调整求职目标", "跟进投递结果"]),
          acceptance: pick(["学生完成简历修改", "学生投递至少3个岗位", "学生参加模拟面试", "学生更新求职意向"]),
          status: pick(["pending", "in_progress", "done"]),
          followUps: JSON.stringify([]),
        },
      });
      taskCount++;
    }
  }
  console.log(`生成 ${taskCount} 条帮扶任务`);

  console.log("\n✅ 模拟数据生成完成！");
  console.log(`学院: ${colleges.length} | 专业: ${majors.length} | 学生: ${studentList.length} | 岗位: ${jobs.length} | 企业: ${enterpriseRecords.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
