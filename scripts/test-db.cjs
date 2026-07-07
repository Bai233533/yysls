const { Client } = require('pg');

// 尝试不同的地址
const addresses = [
  'pc-uf609498runb7y2z9.pg.polardb.rds.aliyuncs.com',
  'pc-uf609498runb7y2z9.rwlb.rds.aliyuncs.com',
  'pe-uf67xwsndc3z8dfy.pg.polardb.rds.aliyuncs.com',
];

async function testAddress(host) {
  console.log(`\n尝试连接: ${host}`);
  const client = new Client({
    host: host,
    port: 5432,
    user: 'bai',
    password: 'Cq021015',
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 8000,
  });

  try {
    await client.connect();
    console.log(`✅ 连接成功: ${host}`);
    const res = await client.query('SELECT version()');
    console.log('版本:', res.rows[0].version);
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ 失败: ${err.message}`);
    return false;
  }
}

async function main() {
  for (const addr of addresses) {
    const success = await testAddress(addr);
    if (success) {
      console.log('\n🎉 找到可用地址:', addr);
      return;
    }
  }
  console.log('\n❌ 所有地址都连接失败');
  console.log('请检查：');
  console.log('1. 白名单是否设置为 0.0.0.0/0');
  console.log('2. 是否已申请公网地址');
}

main();
