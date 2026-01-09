import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// 默认密码
const DEFAULT_PASSWORD = 'seeyao123';

// 用户数据
interface UserData {
  account: string;
  name: string;
  gender: number; // 1: 男, 0: 女
  phone?: string;
  email: string;
}

const usersData: UserData[] = [
  { account: '15230', name: '刘宇轩', gender: 1, email: 'yuxuanl@scae-sh.com' },
  { account: '14876', name: '高佳南', gender: 1, email: 'jianang@scae-sh.com' },
  { account: '13426', name: '张子滢', gender: 0, email: 'ziyingz@scae-sh.com' },
  { account: '1097', name: '李国阳', gender: 1, email: 'guoyangl@scae-sh.com' },
  { account: '5382', name: '李飞燕', gender: 0, email: 'feiyanl@scae-sh.com' },
  { account: '6092', name: '张青春', gender: 1, email: 'qingchunz@scae-sh.com' },
  { account: '3716', name: '黄微益', gender: 1, email: 'weiyih@scae-sh.com' },
  { account: '6062', name: '杜文俊', gender: 1, email: 'wenjund@scae-sh.com' },
  { account: '7072', name: '王方', gender: 1, email: 'fangw@scae-sh.com' },
  { account: '6024', name: '朱慧健', gender: 1, email: 'huijianz@scae-sh.com' },
  { account: '4570', name: '王全聪', gender: 1, email: 'quancongw@scae-sh.com' },
  { account: '10328', name: '杨亮东', gender: 1, email: 'liangdongy@scae-sh.com' },
  { account: '0028', name: '黄正辉', gender: 1, email: 'zhenghuih@scae-sh.com' },
  { account: '1173', name: '赵启智', gender: 1, email: 'qizhiz@scae-sh.com' },
  { account: '1458', name: '陶俊铨', gender: 1, email: 'junquant@scae-sh.com' },
  { account: '1420', name: '司磊', gender: 1, email: 'leis@scae-sh.com' },
  { account: '9128', name: '戚得权', gender: 1, email: 'dequanq@scae-sh.com' },
  { account: '2901', name: '顾伟林', gender: 1, email: 'weiling@scae-sh.com' },
  { account: '8327', name: '王鹏飞', gender: 1, email: 'pengfeiw@scae-sh.com' },
  { account: '3774', name: '陈叶', gender: 0, email: 'yec@scae-sh.com' },
  { account: '8166', name: '董奇', gender: 1, email: 'qid@scae-sh.com' },
  { account: '1489', name: '武爱华', gender: 1, email: 'aihuaw@scae-sh.com' },
  { account: '2878', name: '徐燕', gender: 0, email: 'yanx@scae-sh.com' },
  { account: '7146', name: '费超', gender: 1, email: 'chaof@scae-sh.com' },
  { account: '0128', name: '黄仁丽', gender: 0, email: 'renlih@scae-sh.com' },
  { account: '3084', name: '柯献成', gender: 1, phone: '80319529', email: 'xianchengk@scae-sh.com' },
  { account: '5664', name: '李忙', gender: 1, email: 'mangl@scae-sh.com' },
  { account: '10458', name: '陆冲宇', gender: 1, email: 'chongyul@scae-sh.com' },
  { account: '6118', name: '唐晓雯', gender: 0, email: 'xiaowent@scae-sh.com' },
  { account: '0645', name: '王波', gender: 1, email: 'bow@scae-sh.com' },
  { account: '1207', name: '杜爱琼', gender: 1, email: 'aiqiongd@scae-sh.com' },
  { account: '2904', name: '孔超', gender: 1, email: 'chaok@scae-sh.com' },
  { account: '4580', name: '孙路闯', gender: 1, email: 'luchuangs@scae-sh.com' },
  { account: '1204', name: '郑宗裕', gender: 1, email: 'zongyuz@scae-sh.com' },
  { account: '6070', name: '邵沙沙', gender: 1, email: 'shashas@scae-sh.com' },
  { account: '5662', name: '蒋燕菲', gender: 0, email: 'yanfeij@scae-sh.com' },
  { account: '1370', name: '周玉伟', gender: 1, email: 'yuweiz@scae-sh.com' },
  { account: '9607', name: '周金威', gender: 1, email: 'jinweiz@scae-sh.com' },
  { account: '3750', name: '张军伟', gender: 1, email: 'junweiz@scae-sh.com' },
  { account: '6026', name: '印琳', gender: 0, email: 'liny@scae-sh.com' },
  { account: '7959', name: '冯士婷', gender: 0, email: 'shitingf@scae-sh.com' },
  { account: '8371', name: '程文俊', gender: 1, email: 'wenjunc@scae-sh.com' },
  { account: '9630', name: '吴佩申', gender: 1, email: 'peishenw@scae-sh.com' },
  { account: '10330', name: '彭丽华', gender: 0, email: 'lihuap@scae-sh.com' },
  { account: '0257', name: '李倚松', gender: 1, email: 'yisongl@scae-sh.com' },
  { account: '2896', name: '顾乾龙', gender: 1, email: 'qianlongg@scae-sh.com' },
  { account: '2207', name: '金超', gender: 1, email: 'chaoj@scae-sh.com' },
  { account: '3967', name: '孙莉花', gender: 0, email: 'lihuas@scae-sh.com' },
  { account: '4671', name: '许龙', gender: 1, email: 'longx@scae-sh.com' },
  { account: '2453', name: '陈璠', gender: 1, email: 'panc@scae-sh.com' },
  { account: '4970', name: '王英', gender: 0, email: 'yingw@scae-sh.com' },
  { account: '6249', name: '卢旭茹', gender: 0, email: 'xurul@scae-sh.com' },
  { account: '10078', name: '陶友丽', gender: 0, email: 'youlit@scae-sh.com' },
  { account: '6057', name: '舒友朋', gender: 1, email: 'youpengs@scae-sh.com' },
  { account: '7799', name: '张裔', gender: 1, email: 'yiz@scae-sh.com' },
  { account: '7977', name: '陈喜禄', gender: 1, email: 'xiluf@scae-sh.com' },
  { account: '10291', name: '窦万里', gender: 1, email: 'wanlid@scae-sh.com' },
  { account: '10912', name: '刘彪', gender: 1, phone: '18130772378', email: 'biaol@scae-sh.com' },
  { account: '10930', name: '叶长永', gender: 1, email: 'changyongy@scae-sh.com' },
  { account: '10931', name: '陆宇', gender: 1, email: 'yul1@scae-sh.com' },
  { account: '10776', name: '康海龙', gender: 1, email: 'hailongk@scae-sh.com' },
  { account: '10981', name: '成曼丽', gender: 0, email: 'manlic@scae-sh.com' },
  { account: '11058', name: '闫桂雪', gender: 0, email: 'guixuey@scae-sh.com' },
  { account: '11059', name: '纪慧鑫', gender: 1, email: 'huixinj@scae-sh.com' },
  { account: '11924', name: '段扬', gender: 1, phone: '17199918400', email: 'yangd@scae-sh.com' },
  { account: '11404', name: '朱根', gender: 1, email: 'genz@scae-sh.com' },
  { account: '10760', name: '李召飞', gender: 1, phone: '15650143929', email: 'zhaofeil@scae-sh.com' },
  { account: '10181', name: '管武慧', gender: 1, email: 'wuhuig@scae-sh.com' },
  { account: '10804', name: '周科', gender: 1, email: 'kez@scae-sh.com' },
  { account: '11886', name: '赵健华', gender: 1, email: 'jianhuaz@scae-sh.com' },
  { account: '0052', name: '王永和', gender: 1, email: 'yonghew@scae-sh.com' },
  { account: '13945', name: '王文文', gender: 0, email: 'wenwenw@scae-sh.com' },
  { account: '15211', name: '陈浩', gender: 1, email: 'haoc@scae-sh.com' },
  { account: '15218', name: '刘冰毅', gender: 1, phone: '19836135101', email: 'bingyil@scae-sh.com' },
  { account: '12482', name: '万璇', gender: 0, phone: '', email: 'xuanw@scae-sh.com' },
  { account: '13478', name: '韩玉琪', gender: 0, email: 'yuqih@scae-sh.com' },
  { account: '13282', name: '张晓飞', gender: 1, email: 'xiaofeiz@scae-sh.com' },
  { account: '12825', name: '张昊', gender: 1, email: 'haoz@scae-sh.com' },
  { account: '14765', name: '张晒晒', gender: 1, email: 'shaishaiz@scae-sh.com' },
  { account: '15226', name: '杜卫东', gender: 1, email: 'weidongd@scae-sh.com' },
  { account: '14827', name: '徐大伟', gender: 1, email: 'daweix@scae-sh.com' },
  { account: '13075', name: '彭秋旺', gender: 1, email: 'qiuwangp@scae-sh.com' },
  { account: '11930', name: '芮佳丽', gender: 0, email: 'jialir@scae-sh.com' },
  { account: '14245', name: '郭盼', gender: 0, email: 'pang@scae-sh.com' },
  { account: '14297', name: '陈彬', gender: 1, email: 'binc@scae-sh.com' },
  { account: '14525', name: '王亚光', gender: 1, email: 'yaguangw@scae-sh.com' },
  { account: '12671', name: '英旭', gender: 1, email: 'xuy@scae-sh.com' },
  { account: '13742', name: '杨霜', gender: 0, email: 'shuangy13742@scae-sh.com' },
  { account: '14208', name: '闻飞扬', gender: 1, email: 'feiyangw@scae-sh.com' },
  { account: '15220', name: '韩婷婷', gender: 0, email: 'tingtingh@scae-sh.com' },
  { account: '14879', name: '张涛明', gender: 1, email: 'taomingz@scae-sh.com' },
  { account: '15223', name: '李壮', gender: 1, email: 'zhuangl@scae-sh.com' },
  { account: '13072', name: '陈胜州', gender: 1, email: 'shengzhouc@scae-sh.com' },
  { account: '9557', name: '张利兵', gender: 1, email: 'libingz@scae-sh.com' },
  { account: '15214', name: '向文慧', gender: 1, email: 'wenhuix@scae-sh.com' },
  { account: '14260', name: '张梦飞', gender: 1, email: 'mengfeiz@scae-sh.com' },
  { account: '15219', name: '苗桐桐', gender: 1, phone: '13127753096', email: 'tongtongm@scae-sh.com' },
  { account: '13534', name: '陈康', gender: 1, email: 'kangc@scae-sh.com' },
  { account: '8001', name: '孙海龙', gender: 1, phone: '15279115639', email: 'hailongs@scae-sh.com' },
  { account: '13188', name: '王洲', gender: 1, email: 'zhouw@scae-sh.com' },
  { account: '14210', name: '刘奕', gender: 1, email: 'yil@scae-sh.com' },
  { account: '12392', name: '朱素珍', gender: 0, email: 'suzhenz@scae-sh.com' },
  { account: '12431', name: '姬艳萍', gender: 0, email: 'yanpingj@scae-sh.com' },
  { account: '15233', name: '谢玉祥', gender: 1, email: 'yuxiangx@scae-sh.com' },
  { account: '14587', name: '王德元', gender: 1, email: 'deyuanw@scae-sh.com' },
  { account: '15227', name: '薛毅', gender: 1, email: 'yix@scae-sh.com' },
  { account: '15209', name: '田程', gender: 1, email: 'chengt@scae-sh.com' },
  { account: '13973', name: '陈榜', gender: 1, email: 'bangc@scae-sh.com' },
  { account: '3723', name: '赵晓波', gender: 1, email: 'xiaoboz@scae-sh.com' },
  { account: '13071', name: '王群燕', gender: 0, email: 'qunyanw@scae-sh.com' },
  { account: '15222', name: '蔡达标', gender: 1, email: 'dabiaoc@scae-sh.com' },
  { account: '14243', name: '周志立', gender: 1, email: 'zhiliz@scae-sh.com' },
  { account: '14244', name: '张新颖', gender: 0, email: 'xinyingz@scae-sh.com' },
  { account: '11982', name: '葛鑫宇', gender: 1, email: 'xinyug@scae-sh.com' },
];

async function main() {
  console.log('开始导入用户数据...');
  console.log(`默认密码: ${DEFAULT_PASSWORD}`);
  console.log(`总共 ${usersData.length} 个用户`);

  // 生成密码哈希
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const user of usersData) {
    try {
      // 检查用户是否已存在（通过邮箱）
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        console.log(`⏭️  跳过: ${user.name} (${user.email}) - 用户已存在`);
        skipCount++;
        continue;
      }

      // 创建用户
      await prisma.user.create({
        data: {
          email: user.email,
          username: user.account, // 使用账户号作为用户名
          passwordHash,
          displayName: user.name,
          preferences: {
            gender: user.gender,
            phone: user.phone || null,
            account: user.account,
          },
          isActive: true,
          emailVerified: true, // 自动验证
        },
      });

      console.log(`✅ 成功: ${user.name} (${user.email})`);
      successCount++;
    } catch (error) {
      console.error(`❌ 失败: ${user.name} (${user.email})`);
      console.error(`   错误: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n========== 导入完成 ==========');
  console.log(`✅ 成功: ${successCount} 个`);
  console.log(`⏭️  跳过: ${skipCount} 个`);
  console.log(`❌ 失败: ${errorCount} 个`);
  console.log('================================');
}

main()
  .catch((e) => {
    console.error('脚本执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
