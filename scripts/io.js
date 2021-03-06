const ioserver = document.location.host.split(":")[0]
let socketL = io.connect(ioserver+':3333');
let mainGroup = 1
let socketC = io.connect(centralServer+':3333');



socketC.emit('getBaseData', {rest: 1}, (data) => {
    data.list = data.list.map(item => {
        if(item.img.indexOf('http://') == -1){
            item.img = 'http://'+centralServer+':88/'+item.img
        }
        switch (priceCat) {
            case 1: item.price = item.price; break;
            case 2: item.price = item.price2; break;
            case 3: item.price = item.price3; break;
            case 4: item.price = item.price4; break;
            case 5: item.price = item.price5; break;
            default: item.price = item.price;
        }

        return item
    })
    data.groups = data.groups.map(item => {
        if(item.img.indexOf('http://') == -1){
            item.img = 'http://'+centralServer+':88/'+item.img
        }
        return item
    })
    data.imgs = data.imgs.map(item => {
        if(item.img.indexOf('http://') == -1){
            item.img = 'http://'+centralServer+':88/'+item.img
        }
        return item
    })

    app.list = data.list
    app.groups = data.groups
    app.imgs = data.imgs


    function compare(a, b) {
        let compA = a.groupId + a.name
        let compB = b.groupId + b.name
        if (compA > compB) return 1; // если первое значение больше второго
        if (compA == compB) return 0; // если равны
        if (compA < compB) return -1; // если первое значение меньше второго
    }
    function compareG(a, b) {
        let compA = a.position + a.name
        let compB = b.position + b.name
        if (compA > compB) return 1; // если первое значение больше второго
        if (compA == compB) return 0; // если равны
        if (compA < compB) return -1; // если первое значение меньше второго
    }

    app.list.sort(compare)
    app.groups.sort(compareG)

    for(let i in app.groups){
        if(!app.groups[i].blocked){
            app.groupId = app.groups[i].id
            mainGroup = app.groups[i].id
            break
        }

    }



});

socketL.emit('getBaseData', {rest: 1}, (data) => {
    console.log(data)
   app.lastId = data.lastId


});


function changeGroup(newGroup){
    socketL.emit('changeGroup', newGroup, (data) => {
        console.log(data)

    });

}
function deleteOrder(ordernum){
    socketL.emit('deleteOrder', ordernum, (data) => {
        console.log(data)

    });

}
function changePosition(newPosition){
    socketL.emit('changePosition', newPosition, (data) => {
        console.log(data)

    });

}

function makeOrder(dataCart){
    socketL.emit('makeOrder', dataCart, (data) => {
        if(dataCart.fiscalNum != 0){
            app.payHelper = "Выводим информацию на кухонные мониторы"
        }

        let strId = ""
        if (String(data.id).length == 1){
            strId = "00" + data.id
        }
        if (String(data.id).length == 2){
            strId = "0" + data.id
        }
        if (String(data.id).length >= 3){
            strId = String(data.id).slice(-3)
        }


        let msgId = app.litera+"-"+strId
        let message = false
        if(dataCart.error){
            message = dataCart.error
        }
        SendET(serverEO, app.cart, message, msgId, app.orderType)
        app.lastId = data.id

        setTimeout(()=>{app.payHelper = "Готово! Ваш заказ "+msgId}, 2000)
        setTimeout(()=>{app.payed = 1}, 2500)
        setTimeout(app.start, 15000)

    });

}

window.addEventListener('touchmove', ev => {
    if (ev.touches.length > 1) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
    };
}, { passive: false });

window.addEventListener('touchstart', ev => {
    if (ev.touches.length > 1) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
    };
}, { passive: false });

window.addEventListener('touchend', ev => {
    if (ev.touches.length > 1) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
    };
}, { passive: false });




