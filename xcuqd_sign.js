/**
 * @fileoverview 商场云选合集签到 (昌宜兼容性终极修复)
 */

const mallData = $persistentStore.read("mallcoo_multi_data");
const chamToken = $persistentStore.read("chamshare_token");

let summary = "";
let completedTasks = 0;
const totalTasks = 2; 

// --- 1. 昌宜云选任务 (模拟小程序环境) ---
function runChamshare() {
    if (!chamToken) {
        summary += "【昌宜云选】⚠️ 未获取到 Token\n";
        checkDone();
        return;
    }
    
    const request = {
        url: `https://api.crm.chamshare.cn/daySign`,
        method: `POST`,
        headers: {
            'Host': 'api.crm.chamshare.cn',
            'Accept': '*/*',
            'X-App-Token': chamToken,
            'X-App-Platform': 'wxapp',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.42(0x18002a2d) NetType/WIFI Language/zh_CN',
            'Content-Type': 'application/json',
            'Referer': 'https://servicewechat.com/wx2c69d95f50f2249e/1/page-frame.html',
            'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br'
        },
        body: JSON.stringify({}) // 确保 Body 序列化
    };

    $httpClient.post(request, (err, resp, data) => {
        if (err) {
            summary += `【昌宜云选】❌ 网络连接失败\n`;
        } else {
            // 如果返回 403/400 也会触发这里
            try {
                const res = JSON.parse(data);
                if (res.code === 0 || res.code === 200) {
                    summary += `【昌宜云选】✅ 成功: 获得 ${res.data.integral || 0} 积分\n`;
                } else if (res.code === 1101 || (res.msg && res.msg.includes("已签到"))) {
                    summary += `【昌宜云选】ℹ️ 今日已签过\n`;
                } else {
                    summary += `【昌宜云选】❌ 失败: ${res.msg || "状态码 " + res.code}\n`;
                }
            } catch (e) {
                // 如果解析失败，打印原始返回的前 50 个字符，方便我们调试
                const sliceData = data ? data.replace(/\s+/g, '').slice(0, 50) : "无数据";
                summary += `【昌宜云选】❌ 接口异常: ${sliceData}\n`;
            }
        }
        checkDone();
    });
}

// --- 2. 猫酷任务 (保持原样) ---
function runMallcoo() {
    if (!mallData) {
        summary += "【猫酷商场】⚠️ 未抓取到数据\n";
        checkDone();
        return;
    }
    const accounts = JSON.parse(mallData);
    const ids = Object.keys(accounts);
    let mcDone = 0;
    if (ids.length === 0) { checkDone(); return; }
    
    for (const id of ids) {
        const req = {
            url: `https://m.mallcoo.cn/api/user/User/CheckinV2`,
            method: `POST`,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "MallID": Number(id), "Header": { "Token": accounts[id] } })
        };
        $httpClient.post(req, (err, resp, data) => {
            mcDone++;
            try {
                const res = JSON.parse(data);
                if (res.s === 1 || res.v === true) summary += `【猫酷商场】✅ ID[${id}]: 成功\n`;
                else if (res.m === 2054) summary += `【猫酷商场】ℹ️ ID[${id}]: 已签过\n`;
                else summary += `【猫酷商场】⚠️ ID[${id}]: 失败\n`;
            } catch (e) { summary += `【猫酷商场】❌ 解析失败\n`; }
            if (mcDone === ids.length) checkDone();
        });
    }
}

function checkDone() {
    completedTasks++;
    if (completedTasks === totalTasks) {
        $notification.post("商场合集签到报告", "", summary);
        $done();
    }
}

runChamshare();
runMallcoo();
