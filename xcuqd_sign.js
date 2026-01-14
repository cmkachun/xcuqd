/**
 * @fileoverview 商场云选合集签到 (修正版)
 */

const mallData = $persistentStore.read("mallcoo_multi_data");
const chamToken = $persistentStore.read("chamshare_token");

let summary = "";
let completedTasks = 0;
const totalTasks = 2; 

// --- 1. 昌宜云选任务 (修复版) ---
function runChamshare() {
    if (!chamToken) {
        summary += "【昌宜云选】⚠️ 未获取到 Token，请先抓包\n";
        checkDone();
        return;
    }
    const request = {
        url: `https://api.crm.chamshare.cn/daySign`,
        method: `POST`,
        headers: { 
            'X-App-Token': chamToken, 
            'Content-Type': 'application/json', 
            'X-App-Platform': 'wxapp',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.10(0x18000a2f) NetType/WIFI Language/zh_CN'
        },
        body: JSON.stringify({}) // 确保发送空的 JSON 对象
    };
    $httpClient.post(request, (err, resp, data) => {
        if (err) {
            summary += `【昌宜云选】❌ 网络请求失败\n`;
        } else {
            try {
                const res = JSON.parse(data);
                // 修正逻辑：判断 code 0 或 200，并处理已签到状态
                if (res.code === 0 || res.code === 200) {
                    summary += `【昌宜云选】✅ 成功: 获得 ${res.data.integral} 积分\n`;
                } else if (res.code === 1101 || res.msg.includes("已签到")) {
                    summary += `【昌宜云选】ℹ️ 今日已签过\n`;
                } else {
                    summary += `【昌宜云选】❌ 错误: ${res.msg || "未知原因"}\n`;
                }
            } catch (e) { 
                summary += `【昌宜云选】❌ 解析失败: ${data.slice(0, 20)}\n`; 
            }
        }
        checkDone();
    });
}

// --- 2. 猫酷任务 ---
function runMallcoo() {
    if (!mallData) {
        summary += "【猫酷商场】⚠️ 未抓取到账号数据\n";
        checkDone();
        return;
    }
    try {
        const accounts = JSON.parse(mallData);
        const ids = Object.keys(accounts);
        if (ids.length === 0) { 
            summary += "【猫酷商场】⚠️ 账号列表为空\n"; 
            checkDone(); 
            return; 
        }
        
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
                    else summary += `【猫酷商场】⚠️ ID[${id}]: 失败(${res.m})\n`;
                } catch (e) { summary += `【猫酷商场】❌ ID[${id}]: 解析失败\n`; }
                if (mcDone === ids.length) checkDone();
            });
        }
    } catch (e) {
        summary += "【猫酷商场】❌ 账号数据损坏\n";
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

// 启动执行
runChamshare();
runMallcoo();
