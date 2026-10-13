# XYStation

GodTalk 的个人作品站。纯静态页面，部署到 GitHub Pages。

打开后先加载进站，向上滚动进入站台，再点信标查看作品。

仓库：<https://github.com/godtalk/XYStation>

## 本地预览

用浏览器打开 `index.html`，或在目录里启动任意静态服务器。

## 推送到 GitHub

```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/godtalk/XYStation.git
git push -u origin master
```

## 开通 GitHub Pages

1. 打开仓库 → **Settings** → **Pages**
2. Source 选 **Deploy from a branch**
3. Branch 选 `master`，目录选 `/ (root)`
4. Save 后访问：<https://godtalk.github.io/XYStation/>
