import { window } from 'vscode';
import { BaseHelper } from './BaseHelper';


export class LogHelper extends BaseHelper {

    // 创建输出频道
    // public static channel = vscode.window.createOutputChannel('SanguoshaExtensionTools', 'log');
    private static channel = window.createOutputChannel('SanguoshaExtensionTools', { log: true });

    public static getNowTime() {
        let d = new Date();
        let year = d.getFullYear();
        let month = d.getMonth() + 1;
        let date = d.getDate();
        let hour = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
        let minute = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
        let second = d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds();
        let milliSeconds = d.getMilliseconds() < 100 ? (d.getMilliseconds() < 10 ? "00" + d.getMilliseconds() : "0" + d.getMilliseconds()) : d.getMilliseconds();
        var currentTime = year + '-' + month + '-' + date + ' ' + hour + ':' + minute + ':' + second + '.' + milliSeconds;
        return currentTime;
    }

    /**
     * 将日志信息写入频道与调试控制台。
     * @param msg 日志信息字符串
     * @param level 日志等级，默认是 Info 级别
     * @param show 日志频道显示选项，默认 Warn 级别及以上的日志将输出频道切换为当前频道
     */
    public static log(msg: string, level: 'default' | 'debug' | 'info' | 'warn' | 'error' = 'default', show: 'default' | 'always' | 'never' = 'default') {

        switch (level) {
            case 'debug':
                LogHelper.channel.debug(msg);
                console.debug(LogHelper.getNowTime(), '[debug]', msg);
                break;
            case 'info':
                LogHelper.channel.info(msg);
                console.info(LogHelper.getNowTime(), '[info]', msg);
                break;
            case 'warn':
                LogHelper.channel.warn(msg);
                console.warn(LogHelper.getNowTime(), '[warn]', msg);
                break;
            case 'error':
                LogHelper.channel.error(msg);
                console.error(LogHelper.getNowTime(), '[error]', msg);
                break;
            case 'default':
            default:
                LogHelper.channel.appendLine(msg);
                console.log(LogHelper.getNowTime(), '[info]', msg);
                break;
        }

        switch (show) {
            case 'default':
                if (level === 'warn' || level === 'error') {
                    LogHelper.channel.show();
                } break;
            case 'always':
                LogHelper.channel.show();
                break;
            case 'never':
                break;
            default:
                break;
        }

    }

    /**
     * 在 UI 中显示日志频道。
     */
    public static show() {
        this.channel.show();
    }

}
