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
			if (event.clientY < 0.16 * windowHeight) {
				preview.classList.add('show-controls');
			} else {
				preview.classList.remove('show-controls');
			}
		});

		preview.querySelectorAll('.img-container').forEach((el) => {
			let y;

			el.addEventListener('pointerdown', (event) => {
				y = event.clientY;
				el.setAttribute('data-pointerdown', '');
				el.addEventListener('pointermove', onDrag);
			});

			el.addEventListener('pointerup', (y) => {
				el.getAttribute('data-pointerdown');
				el.removeAttribute('data-pointerdown');
				el.removeEventListener('pointermove', onDrag);
			});

			el.addEventListener('wheel', (event) => {
				height = clampHeightToWindow(height + event.deltaY);
				el.firstElementChild.style.height = `${height}px`;
			});

			window.addEventListener('resize', () => {
				windowHeight = window.innerHeight;
				windowWidth = window.innerWidth;
				height = clampHeightToWindow(height);
				el.firstElementChild.style.height = `${height}px`;
			});

			function clampHeightToWindow(height) {
				return Math.max(
					Math.min(windowHeight, originalHeight),
					Math.min(originalHeight, Math.min(height, getMaxHeight(originalWidth, originalHeight, windowWidth)))
				);

				function getMaxHeight(width, height, maxWidth) {
					return maxWidth * height / width;
				}
			}

			function onDrag(event) {
				if (!event.currentTarget.hasAttribute('data-pointerdown')) return;
				const { scrollTop, scrollHeight } = el;
				const dy = event.clientY - y;
				el.scrollTop = Math.min(scrollHeight, Math.max(0, scrollTop - dy));
				y = event.clientY;
			}
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