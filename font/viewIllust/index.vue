<template>
	<div ref="box" class="picBox">
		<canvas ref="can" tabindex="1" class="picCan" :class="{ mdown: mDown }"
			@keydown="onKeyDown"
			@wheel="onWheel"
			@mousedown="onMouseDown"
			@mouseup="onMouseUp"
			@mousemove="onMouseMove"
		/>
	</div>
</template>

<script>
	export default {
		data: function() {
			return X.init(this.$options._componentTag, {
				dict: {}
			}, {
				tab: {},

				illust: {}
			}, {
				idxNow: 0,
				picNow: {},

				timeout: 0,
				interval: 0,

				offW: 0,
				offH: 0,

				zoom: 100,

				mDown: false,
				mMove: false,

				page: 0,

				loaded: 0,

				files: [],
			});
		},

		watch: {
			'S.illust': async function(now) {
				this.page = 0;

				this.initPlayer(now);
			}
		},

		mounted: function() {
			this.$refs.can.focus();
		},

		methods: {
			onPause: function() {
				let illust = this.S.illust;

				if(illust.type != 2) {
					this.page++;

					if(this.page >= illust.count) {
						this.page = 0;
					}

					this.initPlayer(illust);
				}
				else {
					if(this.timeout) {
						clearTimeout(this.timeout);

						this.timeout = 0;
					}
					else {
						this.playFrame(this.idxNow);
					}
				}
			},
			onKeyDown: function(e) {
				if(e.keyCode == 32) {
					this.onPause();
				}
				else if(e.keyCode == 107) {
					this.zoom = this.zoom + 10;
				}
				else if(e.keyCode == 109 && this.zoom - 10 > 0) {
					this.zoom = this.zoom - 10;
				}
				else {
					let off = 1;

					if(e.ctrlKey) { off = 100; }
					if(e.altKey) { off = 1; }

					if(e.keyCode == 37) {

						this.offW -= off;
					}
					else if(e.keyCode == 38) {
						this.offH -= off;
					}
					else if(e.keyCode == 39) {
						this.offW += off;
					}
					else if(e.keyCode == 40) {
						this.offH += off;
					}
				}
			},
			onWheel: function(e) {
				if(e.deltaY > 0 && this.zoom - 10 > 0) {
					this.zoom = this.zoom - 10;
				}
				else {
					this.zoom = this.zoom + 10;
				}

				this.reloadFrame();
			},
			onMouseDown: function() {
				this.$set(this, 'mDown', true);
				this.$set(this, 'mMove', false);
			},
			onMouseUp: function() {
				this.$set(this, 'mDown', false);

				if(!this.mMove) {
					this.onPause();
				}
			},
			onMouseMove: function(e) {
				if(this.mDown && e.buttons == 1) {
					this.$set(this, 'mMove', true);

					this.offH += e.movementY;
					this.offW += e.movementX;

					this.reloadFrame();
				}
			},

			reloadFrame: function() {
				this.loadPic(this.picNow);
			},
			nextFrame: function(frame) {
				this.idxNow = frame.index;

				if(frame.pic) {
					this.loadPic(frame.pic);
				}

				this.timeout = setTimeout(frame.loaded, frame.delay);
			},
			loadPic: function(pic) {
				this.picNow = pic;

				let ctx = this.$refs.can.getContext('2d');
				let box = this.$refs.box;

				let boxW = box.offsetWidth - 1;
				let boxH = box.offsetHeight - 1;

				let picW = pic.width;
				let picH = pic.height;

				let finW = picW;
				let finH = picH;

				ctx.clearRect(this.lastLeft, this.lastTop, this.lastFinW, this.lastFinH);

				ctx.canvas.width = boxW;
				ctx.canvas.height = boxH;

				if(finW < boxW) {
					let diff = 1 - ((finW - boxW) / finW);

					finW = ~~(diff * finW);
					finH = ~~(diff * finH);
				}

				if(finH < boxH) {
					let diff = 1 - ((finH - boxH) / finH);

					finW = ~~(diff * finW);
					finH = ~~(diff * finH);
				}

				if(finW > boxW) {
					let diff = 1 - ((finW - boxW) / finW);

					finW = ~~(diff * finW);
					finH = ~~(diff * finH);
				}

				if(finH > boxH) {
					let diff = 1 - ((finH - boxH) / finH);

					finW = ~~(diff * finW);
					finH = ~~(diff * finH);
				}

				this.lastLeft = (boxW - finW) / 2 + this.offW - finW * ((this.zoom / 100 - 1) / 2);
				this.lastTop = (boxH - finH) / 2 + this.offH - finH * ((this.zoom / 100 - 1) / 2);
				this.lastFinW = finW * this.zoom / 100;
				this.lastFinH = finH * this.zoom / 100;

				ctx.drawImage(pic, this.lastLeft, this.lastTop, this.lastFinW, this.lastFinH);

				ctx.font = '14px bold 微软雅黑';
				ctx.fillStyle = 'snow';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(this.files.length - this.idxNow, boxW - 24, boxH - 14);
			},
			playFrame: function(nowPos = 0) {
				if(nowPos >= this.files.length) {
					nowPos = 0;
				}

				let now = this.files[nowPos];

				if(this.loaded >= this.files.length) {
					clearTimeout(this.timeout);

					this.nextFrame(now);
				}
				else {
					this.idxNow = nowPos;

					this.loadPic(now.pic);

					this.timeout = setTimeout(function() {
						if(now.loaded) {
							this.playFrame(nowPos + 1);
						}
						else {
							this.interval = setInterval(function() {
								if(now.next.loaded) {
									clearInterval(this.interval);

									this.playFrame(now.next.index);
								}
							}.bind(this), 10);
						}
					}.bind(this), now.delay);
				}
			},
			initPlayer: function(illust) {
				clearInterval(this.timeout);
				clearInterval(this.interval);

				this.loader = 0;
				this.idxNow = 0;

				let iid = illust.iid;

				if(illust.type == 2) {
					let files = this.files = illust.files || illust.stat.files;

					let prev = files[files.length - 1];
					let index = 0;

					for(let frame of files) {
						prev.next = frame;
						prev = frame;

						frame.index = index++;

						let pic = frame.pic = new Image();

						pic.src = `api/picture?iid=${iid}&file=${frame.file}&type=2`;

						pic.addEventListener('load', function() {
							this.loaded++;

							frame.loaded = function() {
								this.nextFrame(frame.next);
							}.bind(this);
						}.bind(this));

						if(files[0] === frame) {
							pic.addEventListener('load', function() {
								this.playFrame();
							}.bind(this));
						}
					}
				}
				else {
					let files = this.files = illust.files || illust.stat.files;

					let pic = new Image();
					pic.src = `api/picture?iid=${iid}&page=${this.page}&file=${files[0].file}`;

					pic.addEventListener('load', function() {
						this.loadPic(pic);
					}.bind(this));
				}
			}
		}
	};
</script>

<style scoped>
	.picBox {
		overflow: hidden;
	}

	.picCan {
		position: relative;

		width: 100%;
		height: 100%;

		cursor: grab;
	}

	.mdown {
		cursor: grabbing;
	}
</style>