function Nearest(img, w, h) {
    w = Math.round(w)
    h = Math.round(h)
    let dx = img.width / w,
        dy = img.height / h;
    let tmp = Array.from({length:h*w*4}, (_, i)=>{
        let cell = i / 4
        let x = Math.floor((cell % w)),
            y = Math.floor((cell - x) / w),
            b = i % 4;
        x = Math.round(x * dx)
        y = Math.round(y * dy)
        return img.data[(y * img.width + x) * 4 + b]
    })
    return new ImageData(new Uint8ClampedArray(tmp), w, h)
}

class Mosaic {
    constructor(container) {
        this.container = container
        this.canvas = document.createElement("canvas")
        container.appendChild(this.canvas)
        this._cache = document.createElement("canvas")
        this.cache_context = null
        this.cache_data = null
        this.origin = null
        this.edited = null
        this.init()
    }

    set cache(img) {
        this._cache.width = img.width
        this._cache.height = img.height
        this.cache_context = this._cache.getContext('2d')
        this.cache_context.drawImage(img, 0, 0)
        this.cache_data = this.cache_context.getImageData(0, 0, img.width, img.height)
    }

    init() {
        let h = this.container.clientHeight,
            w = this.container.clientWidth
        this.canvas.height = h
        this.canvas.width = w
    }

    update(img, density, sharpen) {
        this.cache = img
        this.updateWitoutFile(density, sharpen)
    }

    updateWitoutFile(density, sharpen) {
        let ratio = this.cache_data.width / this.cache_data.height, h, w;
        let container_width = this.container.clientWidth,
            container_height = this.container.clientHeight
        if(ratio < 1) {
            h = container_height
            w = h * ratio
            console.log(container_height, ratio)
        } else if(ratio == 1) {
            h = w = Math.min(container_height, container_width)
        } else {
            w = container_width
            h = w / ratio
        }
        if(h > container_height) {
            h = container_height
            w = h * ratio
        }
        if(w > container_width) {
            w = container_width
            h = w / ratio
        }
        h = Math.round(h)
        w = Math.round(w)
        this.canvas.width = w
        this.canvas.height = h
        let ctx = this.canvas.getContext('2d')
        let data = Nearest(this.cache_data, w, h)
        let data2 = this.make(data, density, sharpen)
        ctx.putImageData(data2, 0, 0)
    }

    make(img, density, sharpen) {
        let tmp = Array.from(img.data)
        for(let h=0; h<img.height; ++h) {
            for(let w=0; w<img.width; ++w) {
                if(h % density == 0 && w % density == 0) {
                    for(let i=0; i<density; ++i) {
                        for(let j=0; j<density; ++j) {
                            if(h+i<img.height && w+j < img.width) {
                                for(let b=0; b<4; ++b) {
                                    tmp[4 * ((h+i)*img.width + w+j) + b] = tmp[4 * (h*img.width + w) + b]
                                }
                            }
                        }
                    }
                }
            }
        }
        return new ImageData(new Uint8ClampedArray(tmp), img.width, img.height)
    }
}


class Manager {
    constructor(loader, container, filename, density, sharpen, realtime) {
        this.loader = loader
        this.mosaic = new Mosaic(container)

        this._filename = filename
        this._density = density
        this._sharpen = sharpen
        this._realtime = realtime || true
    }

    download() {
        let anchor = document.createElement('a')
        anchor.download = new Date().getTime() + " by miaobuao" + this.file.name
        let canvas = document.createElement("canvas")
        let data = this.mosaic.make(this.mosaic.cache_data, this.density, this.sharpen)
        canvas.height = data.height
        canvas.width = data.width
        let ctx = canvas.getContext('2d')
        ctx.putImageData(data, 0, 0)
        anchor.href = canvas.toDataURL(this.file.type)
        anchor.click()
    }

    get file() {
        if(this.loader.files && this.loader.files[0])
            return this.loader.files[0]
        return null
    }

    updateEvent() {
        if(this.realtime) {
            this._density.oninput = (e) => {
                this.mosaic.updateWitoutFile(this.density, this.sharpen)
            }
            this._sharpen.oninput = e => {
                this.mosaic.updateWitoutFile(this.density, this.sharpen)
            }
            this._density.onchange = null
            this._sharpen.onchange = null
        } else {
            this._density.onchange = (e) => {
                this.mosaic.updateWitoutFile(this.density, this.sharpen)
            }
            this._sharpen.onchange = e => {
                this.mosaic.updateWitoutFile(this.density, this.sharpen)
            }
            this._density.oninput = null
            this._sharpen.oninput = null
        }
    }

    get filename() {
        return this._filename.value
    }

    set filename(v) {
        this._filename = v
    }

    get density() {
        return this._density.value
    }

    get sharpen() {
        return this._sharpen.value
    }

    set realtime(v) {
        if(typeof v == "boolean") {
            this._realtime = v
        }
        this.updateEvent()
    }

    get realtime() {
        return this._realtime
    }

    update() {
        let file = this.file, img = new Image(), mosaic = this.mosaic,
            density = this.density, sharpen = this.sharpen
        if(file.type.slice(0, 5) == "image") {
            this._filename.innerText = file.name
            this.updateEvent()
            let reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = function() {
                img.src = this.result
                img.onload = function() {
                    mosaic.update(img, density, sharpen)
                }
            }
        } else {
            console.log("not a image.")
            alert("请选择一个图片")
        }
    }
}
