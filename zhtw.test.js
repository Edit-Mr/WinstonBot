import { expect, test, suite } from "vitest";
import { detectChineseType } from "./zhtw.js";

suite("detectChineseType", () => {
  suite("純繁體中文文字", () => {
    const texts = [
      "繁體中文測試",
      "看來還需要設定書寫語言偵測功能（）。",
      "我記得預設的當時也是遇到些爛問題，所以早先卸載了",
      "Termux 跟 UserLAnd 裝 Python 套件也要用奇怪的方法 ",
      "剛考完他的廣告投放檢定，其中一個選項就是縣市",
      "不 personal 但確實是廣告",
      "這好可怕",
      "你有手機了噢？",
      "額現在跟我其他專案放在一起，可以直接搬嗎還是要重新開？",
    ];

    for (const text of texts) {
      test(text, () => {
        expect(detectChineseType(text)).toBe("Traditional");
      });
    }
  });

  suite("純簡體中文文字", () => {
    const texts = [
      "简体中文测试",
      "gcc也是32位的。。。这个树莓派要没救了",
      "我在想一些歪门邪道的事情，但是chatgpt和自己矛盾了¿",
      "救命我发现了很奇怪的事情",
      "发现我的pip支持的tag是armv7的",
      "但是我的芯片架构是aarch64",
      "原来是系统自带的python是32位的",
    ];

    for (const text of texts) {
      test(text, () => {
        expect(detectChineseType(text)).toBe("Simplified");
      });
    }
  });

  suite("無法判別", () => {
    const texts = [
      "噢",
      "我使用 pip debug --verbose",
      "idk how to but maybe try",
      "用 tensorflow-cpu? ",
      "就是 personal ads 吧",
      "不是",
    ];

    for (const text of texts) {
      test(text, () => {
        expect(detectChineseType(text)).toBe("Unknown");
      });
    }
  });
});
