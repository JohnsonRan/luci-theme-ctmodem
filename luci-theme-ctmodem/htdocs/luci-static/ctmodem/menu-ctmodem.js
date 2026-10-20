/*!
 * menu-ctmodem.js - luci-theme-ctmodem 三层导航渲染
 *
 * 一级：橙条 #topmenu
 * 二级：蓝条 #tabmenu
 * 三级：#leftmenu 左侧灰栏
 *
 * Licensed to the public under the MIT License.
 */
'use strict';

(function () {
	var UI = null;

	function txt(node) {
		return node ? _(node.title) : '';
	}

	function findByName(list, name) {
		for (var i = 0; i < list.length; i++) {
			if (list[i].name === name)
				return list[i];
		}
		return null;
	}

	/* 会话相关的元菜单不参与导航（如 Logout） */
	function filterMeta(list) {
		return list.filter(function (child) {
			return child && child.name !== 'logout';
		});
	}

	function url(parts) {
		var seg = [];

		for (var i = 0; i < parts.length; i++) {
			if (parts[i])
				seg.push(parts[i]);
		}

		if (!seg.length)
			return L.url();

		return L.url.apply(L, seg);
	}

	function renderList(sel, list, activeName, hrefFn, activeClass) {
		var ul = document.querySelector(sel);

		if (!ul)
			return null;

		while (ul.firstChild)
			ul.removeChild(ul.firstChild);

		if (!list.length) {
			ul.style.display = 'none';
			return null;
		}

		ul.style.display = '';

		var active = null;

		list.forEach(function (child) {
			var isActive = (child.name === activeName);
			var li = document.createElement('li');

			li.className = 'menu-item-' + child.name + (isActive ? ' active' : '');
			if (isActive)
				active = child;

			var a = document.createElement('a');
			a.href = hrefFn(child);
			a.textContent = txt(child);
			li.appendChild(a);
			ul.appendChild(li);
		});

		return active;
	}

	function render(tree) {
		var dp = (L.env.dispatchpath || []).slice();
		var root = tree || {};
		var modeName = dp[0] || '';
		var mode = (modeName && root.children && root.children[modeName]) ? root.children[modeName] : root;

		/* 一级菜单 */
		var l1 = filterMeta(UI.menu.getChildren(mode));

		if (!l1.length && root !== mode) {
			mode = root;
			l1 = filterMeta(UI.menu.getChildren(mode));
		}

		var n1 = findByName(l1, dp[1]) || l1[0] || null;

		renderList('#topmenu', l1, n1 ? n1.name : dp[1], function (child) {
			return url([modeName, child.name]);
		});

		/* 二级菜单 */
		var l2 = n1 ? filterMeta(UI.menu.getChildren(n1)) : [];
		var n2 = findByName(l2, dp[2]) || null;

		renderList('#ont-tabbar', l2, n2 ? n2.name : dp[2], function (child) {
			return url([modeName, n1 ? n1.name : '', child.name]);
		});

		/* 三级菜单 */
		var l3 = n2 ? filterMeta(UI.menu.getChildren(n2)) : [];

		renderList('#leftmenu', l3, dp[3], function (child) {
			return url([modeName, n1 ? n1.name : '', n2 ? n2.name : '', child.name]);
		});

		/* 左侧标题 / 一级大标题 */
		var loc = document.getElementById('menuloc');
		if (loc)
			loc.textContent = txt(n1) || document.title;

		var lefttitle = document.getElementById('lefttitle');
		if (lefttitle)
			lefttitle.textContent = txt(n2);

		/* 左栏始终保留（与原机一致），即使没有三级菜单 */
		var leftcol = document.getElementById('leftcol');
		if (leftcol)
			leftcol.classList.remove('empty');

		/* 型号菜单（modemenu）放到页脚 */
		renderModeMenu(root);
	}

	function renderModeMenu(root) {
		var ul = document.getElementById('modemenu');

		if (!ul)
			return;

		while (ul.firstChild)
			ul.removeChild(ul.firstChild);

		var list = UI.menu.getChildren(root);
		var dp = L.env.dispatchpath || [];

		if (list.length < 2) {
			ul.style.display = 'none';
			return;
		}

		ul.style.display = '';

		list.forEach(function (child, idx) {
			var isActive = dp.length ? (child.name === dp[0]) : (idx === 0);
			var li = document.createElement('li');
			var a = document.createElement('a');

			if (isActive)
				li.className = 'active';

			a.href = L.url(child.name);
			a.textContent = txt(child);
			li.appendChild(a);
			ul.appendChild(li);
		});
	}

	/* 页面里有内嵌 cbi 标签页（接口/设备/全局网络选项 等）时：
	 *  - 隐藏普通三级菜单和我方加的橙色标题条
	 *  - 左栏直接列出这些标签，当前项由 cbi-tab 类高亮
	 * 注意：这里不使用 MutationObserver，避免与自身改动互相触发造成死循环。
	 */
	function watchPageTabs() {
		var content = document.getElementById('maincontent');
		if (!content || document.documentElement.classList.contains('ont-plain-page'))
			return;

		function sync() {
			var bar = content.querySelector('ul.cbi-tabmenu');
			var leftmenu = document.getElementById('leftmenu');
			var lefttitle = document.getElementById('lefttitle');

			if (leftmenu)
				leftmenu.style.display = bar ? 'none' : '';
			if (lefttitle)
				lefttitle.style.display = bar ? 'none' : '';

			if (!bar)
				return;

			bar.classList.add('ont-no-title');

			[].slice.call(bar.children).forEach(function (li) {
				li.style.visibility = '';
			});
		}

		sync();

		/* 标签切换后重新同步（点击事件代理，不监听 DOM） */
		content.addEventListener('click', function () {
			setTimeout(sync, 120);
		});

		/* 视图是异步渲染的，前 15 秒内轮询几次兜底 */
		var n = 0;
		var timer = setInterval(function () {
			sync();
			if (++n > 30)
				clearInterval(timer);
		}, 500);
	}

	/* OpenClash 这类重度自定义插件：内容区回退为原版样式 */
	function markPlainPage() {
		var content = document.getElementById('maincontent');
		if (!content)
			return;
		if (/openclash/i.test(location.pathname))
			content.classList.add('ont-plain');
	}

	function boot() {
		L.require('ui').then(function (ui) {
			UI = ui;
			return UI.menu.load();
		}).then(function (tree) {
			render(tree);
			markPlainPage();
			watchPageTabs();
		}).catch(function (e) {
			console.error('menu-ctmodem: failed', e);
		});
	}

	if (document.readyState === 'loading')
		document.addEventListener('DOMContentLoaded', boot);
	else
		boot();
})();
