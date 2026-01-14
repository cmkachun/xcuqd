/**
 * @fileoverview 商场云选合集签到 (昌宜请求头/体专项修复)
 */

const mallData = $persistentStore.read("mallcoo_multi_data");
const chamToken = $persistentStore.read("chamshare_token");

let summary = "";
let completedTasks = 0;
const totalTasks = 2; 

function runChamshare() {
    if (!chamToken) {
        summary += "【昌宜云选】⚠️ 未获取到 Token\n";
        checkDone();
        return;
    }
    
    // 深度模拟：补齐了微信小程序请求的所有特征 Header
    const request = {
        url: `https://api.crm.chamshare.cn/daySign`,
        method: `POST`,
        headers: {
            'X-App-Token': chamToken,
            'X-App-Platform': 'wxapp',
            'Content-Type': 'application/json;charset=utf-8', // 增加编码声明
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.42(0x18002a2d) NetType/WIFI Language/zh_CN',
            'Referer': 'https://servicewechat.com/wx2c69d95f50f2249e/1/page-frame.html',
            'Accept': 'application/json, text/plain, */*',
            'Connection': 'keep-alive'
        },
        body: JSON.stringify({}) 
    };

    $httpClient.post(request, (err, resp, data) => {
        if (err) {
            summary += `【昌宜云选】❌ 网络故障\n`;
        } else {
            // 如果返回 400 系列错误，记录状态码
            const statusCode = resp ? resp.status : "unknown";
            try {
                const res = JSON.parse(data);
                if (res.code === 0 || res.code === 200) {
                    summary += `【昌宜云选】✅ 成功: 获得 ${res.data.integral || 0} 积分\n`;
                } else if (res.code === 1101 || (res.msg && res.msg.includes("已签到"))) {
                    summary += `【昌宜云选】ℹ️ 今日已签过\n`;
                } else {
                    summary += `【昌宜云选】❌ 失败: ${res.msg || "状态码 " + statusCode}\n`;
                }
            } catch (e) {
                // 如果是 400 Bad Request，通常是 Body 格式问题
                summary += `【昌宜云选】❌ 请求错误 (状态码: ${statusCode})\n`;
                console.log(`昌宜原始返回内容: ${data}`);
            }
        }
        checkDone();
    });
}

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
