const mallData = $persistentStore.read("mallcoo_multi_data");
const chamToken = $persistentStore.read("chamshare_token");
const chamMarketId = $persistentStore.read("chamshare_marketid") || "1";

let summary = "";
let completedTasks = 0;

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
            'X-App-MarketId': chamMarketId,
            'X-App-Version': '2.1.1',
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
            if (res.code === 0 || res.code === 200) summary += "【昌宜云选】✅ 签到成功\n";
            else if (res.code === 1101 || res.msg?.includes("已签到")) summary += "【昌宜云选】ℹ️ 今日已签\n";
            else summary += `【昌宜云选】❌ ${res.msg || "请求失败"}\n`;
        } catch (e) { summary += "【昌宜云选】❌ 响应异常\n"; }
        checkDone();
    });
}

function runMallcoo() {
    if (!mallData) { summary += "【猫酷】⚠️ 无数据\n"; checkDone(); return; }
    const accounts = JSON.parse(mallData);
    const ids = Object.keys(accounts);
    let mcDone = 0;
    if (ids.length === 0) { checkDone(); return; }
    for (const id of ids) {
        $httpClient.post({
            url: `https://m.mallcoo.cn/api/user/User/CheckinV2`,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "MallID": Number(id), "Header": { "Token": accounts[id] } })
        }, (err, resp, data) => {
            mcDone++;
            try {
                const res = JSON.parse(data);
                if (res.s === 1) summary += `【猫酷】✅ ID[${id}] 成功\n`;
                else if (res.m === 2054) summary += `【猫酷】ℹ️ ID[${id}] 已签\n`;
                else summary += `【猫酷】❌ ID[${id}] 失败\n`;
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
