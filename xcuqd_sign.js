const mallData = $persistentStore.read("mallcoo_multi_data");
const chamToken = $persistentStore.read("chamshare_token");
const chamMarketId = $persistentStore.read("chamshare_marketid") || "1";
const chamVersion = $persistentStore.read("chamshare_version") || "2.1.1";

const nameMap = {
    "10540": "金桥国际",
    "12206": "汇智国际",
    "1": "长泰国际"
};

let summary = "";
let completedTasks = 0;

// --- 昌宜云选 (长泰国际) ---
function runChamshare() {
    if (!chamToken) {
        summary += "【昌宜云选】⚠️ 未获取到 Token，请进入签到页抓包\n";
        checkDone();
        return;
    }
    const name = nameMap[chamMarketId] || `昌宜ID[${chamMarketId}]`;
    const request = {
        url: `https://api.crm.chamshare.cn/daySign`,
        method: `POST`,
        headers: {
            'X-App-Token': chamToken,
            'X-App-MarketId': chamMarketId,
            'X-App-Version': chamVersion,
            'X-App-Platform': 'wxapp',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.67(0x1800432e) NetType/WIFI Language/zh_CN',
            'Referer': 'https://servicewechat.com/wx2ab4eda1b91e0933/59/page-frame.html'
        },
        body: JSON.stringify({})
    };
    $httpClient.post(request, (err, resp, data) => {
        try {
            const res = JSON.parse(data);
            if (res.code === 0 || res.code === 200) summary += `【${name}】✅ 签到成功\n`;
            else if (res.code === 1101 || res.msg?.includes("已签到")) summary += `【${name}】ℹ️ 今日已签\n`;
            else summary += `【${name}】❌ ${res.msg || "请求错误"}\n`;
        } catch (e) { summary += `【${name}】❌ 响应异常\n`; }
        checkDone();
    });
}

// --- 猫酷商场 (金桥、汇智) ---
function runMallcoo() {
    if (!mallData) {
        summary += "【猫酷商场】⚠️ 无账号数据\n";
        checkDone();
        return;
    }
    const accounts = JSON.parse(mallData);
    const ids = Object.keys(accounts);
    let mcDone = 0;
    if (ids.length === 0) { checkDone(); return; }
    for (const id of ids) {
        const name = nameMap[id] || `猫酷ID[${id}]`;
        $httpClient.post({
            url: `https://m.mallcoo.cn/api/user/User/CheckinV2`,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "MallID": Number(id), "Header": { "Token": accounts[id] } })
        }, (err, resp, data) => {
            mcDone++;
            try {
                const res = JSON.parse(data);
                if (res.s === 1) summary += `【${name}】✅ 签到成功\n`;
                else if (res.m === 2054) summary += `【${name}】ℹ️ 今日已签\n`;
                else summary += `【${name}】❌ 失败(${res.m})\n`;
            } catch (e) {}
            if (mcDone === ids.length) checkDone();
        });
    }
}

function checkDone() {
    completedTasks++;
    if (completedTasks === 2) {
        $notification.post("商场合集签到报告", "", summary);
        $done();
    }
}

runChamshare();
runMallcoo();
