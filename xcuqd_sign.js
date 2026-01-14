/**
 * @fileoverview 商场云选合集签到 (昌宜兼容性极致优化版)
 */

const mallData = $persistentStore.read("mallcoo_multi_data");
const chamToken = $persistentStore.read("chamshare_token");

let summary = "";
let completedTasks = 0;
const totalTasks = 2; 

// --- 1. 昌宜云选任务 (极致优化) ---
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
            'X-App-Token': chamToken,
            'X-App-Platform': 'wxapp',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.42(0x18002a2d) NetType/WIFI Language/zh_CN',
            'Referer': 'https://servicewechat.com/wx2c69d95f50f2249e/1/page-frame.html'
        },
        body: '{}' // 尝试直接发送空对象字符串
    };

    $httpClient.post(request, (err, resp, data) => {
        if (err) {
            summary += `【昌宜云选】❌ 网络连接失败\n`;
        } else {
            // 打印状态码辅助排查
            const status = resp ? resp.status : "无";
            try {
                const res = JSON.parse(data);
                if (res.code === 0 || res.code === 200) {
                    summary += `【昌宜云选】✅ 成功: 获得 ${res.data.integral || 0} 积分\n`;
                } else if (res.code === 1101 || (res.msg && res.msg.includes("已签到"))) {
                    summary += `【昌宜云选】ℹ️ 今日已签过\n`;
                } else {
                    summary += `【昌宜云选】❌ 错误: ${res.msg || "状态码 " + res.code}\n`;
                }
            } catch (e) {
                // 如果解析失败，可能是 400 错误
                summary += `【昌宜云选】❌ 请求错误(状态码:${status})\n`;
                console.log("昌宜返回原始数据: " + data);
            }
        }
        checkDone();
    });
}

// --- 2. 猫酷任务 ---
function runMallcoo() {
    if (!mallData) {
        summary += "【猫酷商场】⚠️ 未抓取到数据\n";
        checkDone();
        return;
    }
    try {
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
    } catch (e) { checkDone(); }
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
