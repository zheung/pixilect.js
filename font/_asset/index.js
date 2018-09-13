import 'babel-polyfill';

import Vue from 'Vue';
Vue.config.debug = true;
window.Vue = Vue;

import pubInit from './pub';
import libInit from './lib';

import './css/index.css';
import './css/extend.css';

let main = async function() {
	pubInit();

	let { Loader } = libInit();

	try {
		BUS.module = [{
			'name': '图片中心',
			'show': true,
			'list': [{
				'type': 'center',
				'name': '图片中心',
				'only': true,
				'show': true
			}, {
				'type': 'old',
				'name': '旧版',
				'only': true,
				'show': true
			}]
		}];

		BUS.homeType = 'center';
	}
	catch (error) { true; }

	window.app = new Vue({
		el: '#home',
		data: {
			B: window.BUS,

			views: [],

			isHover: false,
			eve: {},

			popa: {
				opacity: 0,
				top: 0,
				left: 0
			}
		},
		watch: {
			isHover: function(now) {
				if(now) {
					this.popa.opacity = 0.8;
					this.popa.top = (this.eve.clientY+5) + 'px';
					this.popa.left = (this.eve.clientX+5) + 'px';
				}
				else {
					this.popa.opacity = 0;
				}
			}
		},
		computed: {
			frameBoxClass: function() {
				let { B } = this;

				let result = {
					frameBox: true,
					mini: X.comp('homeLeft') && X.comp('homeLeft').pinned && X.comp('homeLeft').expandFocus,

					trans: true
				};

				result['sub'+B.viewNow] = true;

				return result;
			}
		},
		methods: {
			findTab: function(type) {
				for(let group of BUS.module) {
					for(let modl of group.list) {
						if(modl.type == type) {
							return modl;
						}
					}
				}
			},
			changeTab: async function(modl) {
				let { type, name, only, base, time } = modl;
				let views = X.comp('homeNavi').views;

				let tab;

				if(base) {
					await this.setViewNow(base, time, only);
				}
				else {
					time = time || 0;

					if(!time || !only) {
						time++;

						await Loader(type, time);

						modl.time = time;

						await this.setViewNow(type, time, only);

						views.push(tab = { type: `${type}_${time}`, name, only, base: type, time });
					}
					else if(only) {
						if(time) {
							let onNavi = false;

							for(let view of views) {
								if(view.base == type && view.time == time) {
									tab = view;

									onNavi = true;
								}
							}

							if(!onNavi) {
								views.push(tab = { type: `${type}_${time}`, name, only, base: type, time });
							}
						}

						await this.setViewNow(type, time, only);
					}
				}

				return tab;
			},
			closeTab: async function(madule) {
				let views = X.comp('homeNavi').views;

				let index = views.indexOf(madule);
				views.splice(index, 1);

				if(views.length == index) {
					index -= 1;
				}

				let now = views[index];

				await this.setViewNow(now.base, now.time);
			},
			setViewNow: async function(typeNow, time, only) {
				let { B } = this;

				let comp = time ? `${typeNow}_${time}` : typeNow;

				let typeOld = B.viewNow.split(/^([a-zA-Z0-9_]+)_(\d+)$/)[1];

				if(typeNow && typeOld && typeNow != typeOld) {
					Vue.set(B, 'viewNow', comp);

					if(only) {
						window.location.hash = `#${typeNow}`;
					}
				}
				else {
					Vue.set(B, 'viewNow', 'empty');

					this.$nextTick(function() {
						Vue.set(B, 'viewNow', comp);

						if(only) {
							window.location.hash = `#${typeNow}`;
						}
						else {
							window.location.hash = '';
						}
					}.bind(this));
				}
			},

			changeDevice: async function(device) {
				let modl = this.findTab('devicedash');

				let views = X.comp('homeNavi').views;

				if(modl.time) {
					let dict = X.comp('devicedash').dict;

					for(let view of views) {
						if(view.base == 'devicedash' && dict[view.time] && dict[view.time].id == device.id) {
							this.changeTab(view);

							return;
						}
					}
				}

				let tab = await this.changeTab(modl);

				tab.name = '设备：' + device.name;

				X.comp('devicedash').dict[tab.time] = device;

				X.stat(`devicedash_${tab.time}`).data = device;
			}
		},
		mounted: async function() {
			this.B.findTab = this.findTab;
			this.B.changeTab = this.changeTab;
			this.B.changeDevice = this.changeDevice;
			this.B.closeTab = this.closeTab;
		}
	});
};

window.onload = function() { main(); };
// window.onpopstate = function() { L(window.location.hash); };