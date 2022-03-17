function $$(id) {
    return document.getElementById(id)
}
let process = {
    container: $$("process"),
    bar: $$("process-bar")
}

let density = $$("density"),
    sharpen = $$("sharpen"),
    realtime = $$("realtime"),
    loader = $$("loader"),
    download = $$("download"),
    filename = $$("filename"),
    manager = new Manager(loader, $$("display"), filename, density, sharpen)

realtime.checked = manager.realtime
realtime.onchange = e => {
    manager.realtime = e.target.checked
}

download.onclick = function() {
    manager.download()
}

$$("choose-file-icon").onclick = ()=>{ loader.click() }
loader.onchange = e => {
    manager.update()
}
