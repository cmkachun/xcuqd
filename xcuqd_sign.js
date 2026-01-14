#!name=商场云选合集
#!desc=整合猫酷与昌宜云选。请进入各小程序签到页面触发抓包。
#!author=cmkachun
#!icon=https://raw.githubusercontent.com/luestr/IconSet/master/AppIcon/Mallcoo.png

#!arguments={ "cron_time": {"title": "签到执行时间", "defaultValue": "00:05", "type": "string", "desc": "24小时制 HH:mm"} }

[Script]
# 每日定时签到
cron "{cron_time}" script-path=https://raw.githubusercontent.com/cmkachun/xcuqd/main/xcuqd_sign.js, tag=商场合集签到

# 抓包规则 (路径已精准化)
http-request ^https:\/\/m\.mallcoo\.cn\/api\/user\/User\/CheckinV2 script-path=https://raw.githubusercontent.com/cmkachun/xcuqd/main/xcuqd_get_cookie.js, requires-body=true, tag=猫酷抓包
http-request ^https:\/\/api\.crm\.chamshare\.cn\/daySign\/detail script-path=https://raw.githubusercontent.com/cmkachun/xcuqd/main/xcuqd_get_cookie.js, tag=昌宜详情抓包

[MITM]
hostname = m.mallcoo.cn, api.crm.chamshare.cn
