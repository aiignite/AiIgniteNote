/**
 * 修复现有数据库中待同步的笔记
 * 在浏览器控制台运行此脚本
 */

async function fixPendingNotes() {
  const db = await import('./packages/frontend/src/db/index.ts').then(m => m.db);

  // 1. 查找所有 pendingSync 的笔记
  const pendingNotes = await db.notes
    .filter(note => note.pendingSync)
    .toArray();

  console.log(`找到 ${pendingNotes.length} 个待同步笔记:`);

  // 2. 分类处理
  const needsServerId = pendingNotes.filter(n => n.needsServerId);
  const normalPending = pendingNotes.filter(n => !n.needsServerId);

  console.log(`- 需要服务器 ID 的笔记: ${needsServerId.length}`);
  console.log(`- 普通待同步笔记: ${normalPending.length}`);

  // 3. 显示详情
  if (needsServerId.length > 0) {
    console.log("\n需要服务器 ID 的笔记:");
    needsServerId.forEach(note => {
      console.log(`  - ${note.id}: ${note.title}`);
      console.log(`    错误: ${note.lastSyncError || '无'}`);
    });
  }

  if (normalPending.length > 0) {
    console.log("\n普通待同步笔记:");
    normalPending.forEach(note => {
      console.log(`  - ${note.id}: ${note.title}`);
      console.log(`    错误: ${note.lastSyncError || '无'}`);
    });
  }

  // 4. 返回结果供进一步处理
  return {
    total: pendingNotes.length,
    needsServerId: needsServerId.length,
    normalPending: normalPending.length,
    notes: pendingNotes
  };
}

// 运行
fixPendingNotes().then(result => {
  console.log("\n修复脚本执行完成");
  console.log("结果已保存到 window.fixResult");
  window.fixResult = result;
}).catch(error => {
  console.error("执行失败:", error);
});

// 导出供手动使用
window.fixPendingNotes = fixPendingNotes;
