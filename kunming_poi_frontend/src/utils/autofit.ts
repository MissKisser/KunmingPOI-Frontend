export type AutofitOptions = {
    width: number
    height: number
    el: string
    resize?: boolean
}

export default class Autofit {
    private options: AutofitOptions
    private el: HTMLElement | null = null
    private timer: any = null

    constructor(options: AutofitOptions) {
        this.options = {
            resize: true,
            ...options
        }
        this.el = document.querySelector(this.options.el)
        if (!this.el) return

        this.init()
    }

    private init() {
        document.body.style.overflow = 'hidden'
        
        this.render()

        if (this.options.resize) {
            window.addEventListener('resize', this.onResize)
        }
    }

    private onResize = () => {
        if (this.timer) clearTimeout(this.timer)
        this.timer = setTimeout(() => {
            this.render()
        }, 100)
    }

    public render() {
        if (!this.el) return

        const { width, height } = this.options
        const clientWidth = document.documentElement.clientWidth
        const clientHeight = document.documentElement.clientHeight

        const scaleW = clientWidth / width
        const scaleH = clientHeight / height
        const scale = scaleW < scaleH ? scaleW : scaleH

        this.el.style.width = `${width}px`
        this.el.style.height = `${height}px`
        this.el.style.transform = `scale(${scale})`
        this.el.style.transformOrigin = 'left top'
        
        const left = (clientWidth - width * scale) / 2
        const top = (clientHeight - height * scale) / 2
        
        this.el.style.position = 'absolute'
        this.el.style.left = `${left}px`
        this.el.style.top = `${top}px`
        this.el.style.transition = 'all 0.3s ease-out'
    }

    public destroy() {
        window.removeEventListener('resize', this.onResize)
        if (this.timer) clearTimeout(this.timer)
    }
}