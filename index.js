let windowHeight = window.innerHeight;
let windowWidth = window.innerWidth;

const stylesheet = new CSSStyleSheet();
const preview = document.getElementById('preview');
const dropZone = document.getElementById('drop-zone');

dropZone.addEventListener('dragover', (event) => {
	event.preventDefault();
});
dropZone.addEventListener('drop', (event) => {
	event.preventDefault();

	if (event.dataTransfer.items) {
		const items = [...event.dataTransfer.items];
		if (items[0].kind === 'file') {
			const file = items[0].getAsFile();
			showPreview(file);
		}
	}
});

document.getElementById('file-upload').addEventListener('change', (event) => {
	const items = [...event.target.files];
	if (items[0].type.split('/')[0] === 'image') {
		showPreview(items[0]);
	}
});

function showPreview(file) {
	const imgContainer = document.createElement('div');
	imgContainer.className = 'img-container center-contents';

	const img = new Image();
	img.src = URL.createObjectURL(file);
	img.decode().then(() => {
		const originalWidth = img.width;
		const originalHeight = img.height;
		let height = Math.min(windowHeight, img.height);
		let y;

		function onDrag(event) {
			if (!event.currentTarget.hasAttribute('data-pointerdown')) return;
			const { scrollTop, scrollHeight } = imgContainer;
			const dy = event.clientY - y;
			imgContainer.scrollTop = Math.min(scrollHeight, Math.max(0, scrollTop - dy));
			y = event.clientY;
		}

		function setImageHeight(newHeight) {
			const maxHeight = clampHeightToWindow(originalHeight);
			const oldHeight = height;
			const oldTop = imgContainer.scrollTop;
			height = clampHeightToWindow(newHeight);
			imgContainer.firstElementChild.style.height = `${height}px`;
			if (oldHeight < maxHeight) {
				imgContainer.scrollTop = Math.min(
					height - windowHeight,
					oldTop + (height - oldHeight) / 2
				);
			}
		}

		function clampHeightToWindow(height) {
			return Math.max(
				Math.min(windowHeight, originalHeight),
				Math.min(originalHeight, Math.min(height, proportion({ x1: originalWidth, y1: originalHeight, x2: windowWidth })))
			);
		}
		
		img.setAttribute('width', img.width);
		img.setAttribute('height', img.height);
		img.setAttribute('alt', '');
		img.style.height = `${height}px`;

		stylesheet.replaceSync(`dialog::backdrop { --bg-img: url('${img.src}') }`);
		document.adoptedStyleSheets = [stylesheet];
		imgContainer.appendChild(img);

		try {
			const oldImg = preview.querySelector('.img-container');
			oldImg.parentNode.replaceChild(imgContainer, oldImg);
		} catch (error) {
			preview.insertBefore(imgContainer, preview.firstElementChild);
		}

		preview.addEventListener('pointermove', (event) => {
			if (event.clientY < 0.16 * windowHeight || event.clientY <= 68) {
				preview.classList.add('show-controls');
			} else {
				preview.classList.remove('show-controls');
			}
		});

		imgContainer.addEventListener('pointerdown', (event) => {
			y = event.clientY;
			imgContainer.setAttribute('data-pointerdown', '');
			imgContainer.addEventListener('pointermove', onDrag);
		});

		imgContainer.addEventListener('pointerup', (y) => {
			imgContainer.getAttribute('data-pointerdown');
			imgContainer.removeAttribute('data-pointerdown');
			imgContainer.removeEventListener('pointermove', onDrag);
		});

		imgContainer.addEventListener('wheel', (event) => {
			setImageHeight(height + event.deltaY);
		});

		window.addEventListener('resize', () => {
			windowHeight = window.innerHeight;
			windowWidth = window.innerWidth;
			setImageHeight(height);
		});

		preview.showModal();
		URL.revokeObjectURL(img.src);
	});
}

(function () {
	let timer;
	let cursorVisible = true;

	document.addEventListener('pointermove', () => {
		if (timer) clearTimeout(timer);
		if (!cursorVisible) {
			document.body.classList.remove('no-cursor');
			cursorVisible = true;
		}
		timer = setTimeout(disappearCursor, 1000);
	});

	function disappearCursor() {
		timer = null;
		document.body.classList.add('no-cursor');
		cursorVisible = false;
	}
})();

function proportion({ x1, y1, x2 } = {}) {
	return x2 * y1 / x1;
}

function debounce(func, timeout = 300) {
	let timer;
	return (...args) => {
		if (!timer) {
			func.apply(this, args);
		}
		clearTimeout(timer);
		timer = setTimeout(() => {
			timer = undefined;
		}, timeout);
	};
}