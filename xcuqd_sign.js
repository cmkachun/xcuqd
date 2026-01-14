/**
 * @fileoverview 商场云选合集签到 (昌宜深度修复版)
 */

const mallData = $persistentStore.read("mallcoo_multi_data");
const chamToken = $persistentStore.read("chamshare_token");

let summary = "";
let completedTasks = 0;
const totalTasks = 2; 

// --- 1. 昌宜云选任务 (深度修复) ---
function runChamshare() {
    if (!chamToken) {
        summary += "【昌宜云选】⚠️ 未获取到 Token，请先抓包\n";
        checkDone();
        return;
    }
    
    // 补齐所有小程序环境必须的 Header
    const request = {
        url: `https://api.crm.chamshare.cn/daySign`,
        method: `POST`,
        headers: {
            'X-App-Token': chamToken,
            'X-App-Platform': 'wxapp',
            'X-App-Version': '1.0.0', // 增加版本号
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.42(0x18002a2d) NetType/WIFI Language/zh_CN',
            'Referer': 'https://servicewechat.com/wx2c69d95f50f2249e/1/page-frame.html', // 增加引用页
            'Content-Type': 'application/json'
        },
        body: '{}' // 明确设置为字符串格式的空对象
    };

    $httpClient.post(request, (err, resp, data) => {
        if (err) {
            summary += `【昌宜云选】❌ 网络请求失败\n`;
        } else {
            try {
                const res = JSON.parse(data);
                // 昌宜常见的状态码判断
                if (res.code === 0 || res.code === 200) {
                    summary += `【昌宜云选】✅ 成功: 获得 ${res.data.integral || 0} 积分\n`;
                } else if (res.code === 1101 || (res.msg && res.msg.includes("已签到"))) {
                    summary += `【昌宜云选】ℹ️ 今日已签过\n`;
                } else if (res.code === 401) {
                    summary += `【昌宜云选】❌ Token失效，请重新抓包\n`;
                } else {
                    summary += `【昌宜云选】❌ 错误: ${res.msg || "未知原因"}\n`;
                }
            } catch (e) { 
                summary += `【昌宜云选】❌ 解析失败，服务器返回: ${data ? data.slice(0, 30) : "空"}\n`; 
            }
        }
        checkDone();
    });
}

// --- 2. 猫酷任务 (保持不变) ---
function runMallcoo() {
    if (!mallData) {
        summary += "【猫酷商场】⚠️ 未抓取到数据\n";
        checkDone();
        return;
    }
    try {
        const accounts = JSON.parse(mallData);
        const ids = Object.keys(accounts);
        if (ids.length === 0) { summary += "【猫酷商场】⚠️ 账号为空\n"; checkDone(); return; }
        
        let mcDone = 0;
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
    } catch (e) {
        summary += "【猫酷商场】❌ 数据格式错误\n";
        checkDone();
    }
}

function checkDone() {
    completedTasks++;
    if (completedTasks === totalTasks) {
        $notification.post("商场云选签到报告", "", summary);
        $done();
    }
}

// 执行
runChamshare();
runMallcoo();
