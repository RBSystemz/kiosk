const model = require('./models.js')
const ImgDTO = require("./dto/imgDTO")
const SetsDTO = require("./dto/setsDTO")
const ProductDTO = require("./dto/productDTO")
const OrderDTO = require("./dto/orderDTO")
const {gt, lte, ne, in: opIn} = require('sequelize').Op
const hello = async function(){
    console.log('Hello!')
}
const getBaseData = async function(inData){

    let list = await model.Product.findAll()
    const groups = await model.Group.findAll()
    const imgs = await model.Img.findAll()
    const lastId = await model.Order.max("id")
    for(let i in list){
        let sets = await list[i].getSets()
        list[i] = new ProductDTO(list[i])
        sets = sets.map(se => {return new SetsDTO(se)})
        list[i].set = sets
    }
    return {
        list,
        groups,
        imgs,
        lastId
    }


}
const changePosition = async function(data){
    if(data.id){
        const where = {
            id: data.id
        }
        const prod = await model.Product.findOne({where})
            prod.type = data.type
            prod.station = data.station
            prod.blocked = data.blocked
            prod.hiden = data.hiden
            prod.name = data.name
            prod.img = data.img
            prod.price = data.price
            prod.price2 = data.price2
            prod.price3 = data.price3
            prod.price4 = data.price4
            prod.price5 = data.price5
            prod.helper = data.helper
            prod.coupon = data.coupon
            prod.groupId = data.groupId
            prod.position = data.position
            prod.codeOneC = data.codeOneC
        await prod.save()


        if(data.sets && data.sets.length > 0){
            data.sets = data.sets.map(se =>{
                delete se.id
                return se
            })
            let thissets = await model.Set.bulkCreate(data.sets)
            thissets = thissets.map(sets => {return new SetsDTO(sets)})
            let thissetsarr = thissets.map(sets => {
                return sets.id
            })
            await prod.setSets(thissetsarr)

        }
        return true


    }else{
        const prod = {
           type: data.type,
           station: data.station,
           blocked: data.blocked,
           hiden: data.hiden,
           name: data.name,
           img: data.img,
           price: data.price,
           price2: data.price2,
           price3: data.price3,
           price4: data.price4,
           price5: data.price5,
           helper: data.helper,
           coupon: data.coupon,
           groupId: data.groupId,
           position: data.position,
           codeOneC: data.codeOneC
          }


        const product = await model.Product.create(prod)
        if(data.sets && data.sets.length > 0){
                let thissets = await model.Set.bulkCreate(data.sets)
                thissets = thissets.map(sets => {return new SetsDTO(sets)})
                let thissetsarr = thissets.map(sets => {
                    return sets.id
                })
                await product.setSets(thissetsarr)


        }
        return true

    }

}


const changeGroup = async function(data){
    if(data.id){
        const where = {
            id: data.id
        }
        const group = await model.Group.findOne({where})
        group.name = data.name
        group.img = data.img
        group.blocked = data.blocked
        group.position = data.position
        return await group.save()


    }else{
        const group = {
            name: data.name,
            img: data.img,
            blocked: data.blocked,
            position: data.position
          }


        return await model.Group.create(group)


    }

}

const addImg = async function(data){

        const img = {
           name: data.name,
           img: data.img,
           hiden: data.hiden,
           blocked: data.blocked
          }

        const answer = await model.Img.create(img)
        return new ImgDTO(answer)

}

const makeOrder = async function(data){

    let {cart, fiscalNum, orderType} = data
    let order = {}
    order.orderType = orderType
    order.payType = 2
    order.sum = cart.reduce((sum, current) => {
        return sum + current.count * current.price
    }, 0);
    order.status = "payed"
    order.fiscalNum = fiscalNum
    order.returnPay = false
    order.returnCheck = false

    const createdOrder = await model.Order.create(order)
    let newCart = []
    cart = cart.map(item => {
        if(item.selected && item.selected.length > 0){
            let summa =  0
            for(let i in item.selected ){
                item.selected[i].count = item.count
                item.selected[i].price = Number((Number(item.price) / item.selected.length).toFixed(0))
                summa = summa + item.selected[i].price
            }
            let raznica = Number(item.price) - summa
            item.selected[0].price = item.selected[0].price + raznica
            newCart.push(...item.selected)
            return item

        }else{
            newCart.push(item)
            return item
        }

    })
    newCart = newCart.map(item => {
        let newId = String(item.id).split("-")
        item.positionId = Number(newId[0])
        delete item.id
        return item
    })
    let positions = await model.OrderPosition.bulkCreate(newCart)
    positions = positions.map(sets => {
        return sets.id
    })

    await createdOrder.setOrder_positions(positions)
    return new OrderDTO(createdOrder)

}

const findOrder = async function(list){
    const {fiscalNum, id} = list
    let where = {}
    if(fiscalNum){
        where = {
            fiscalNum
        }
    }
    else if(id){
        where = {
            id
        }
    }
    else {
        return null
    }

    const order = await model.Order.findOne({where})

    if(!order){
        return false
    }
    let positions = await order.getOrder_positions()
    positions = positions.map(pos => {
        pos.id = pos.positionId
        delete pos.positionId
        return pos
    })
    const data = {
        order,
        positions
    }
    return data

}



const deleteOrder = async function(list){
    let {fiscalNum, id, returnPay, returnCheck} = list
    let where = {}
    if(!returnPay){
        returnPay = false
    }
    if(!returnCheck){
        returnCheck = false
    }
    if(fiscalNum){
        where = {
            fiscalNum
        }
    }
    else if(id){
        where = {
            id
        }
    }
    else {
        return null
    }

    const order = await model.Order.findOne({where})

    if(!order){
        return false
    }
    order.status = "deleted"
    order.returnPay = returnPay
    order.returnCheck = returnCheck
    return  await order.save()

}

const thisDayOrders = async function(day){
if(!day){
    let date = new Date
    let d = date.getDate()
    if(d < 10){
        d = "0"+d
    }
    let month = date.getMonth() + 1
    if(month < 10){
        month = "0"+month
    }
    let year = date.getFullYear()
    day = year +"-"+ month+ "-" + d
}

 let where = {
     createdAt: {
         [gt]: day+ " 00:00:00.0+10" },
     createdAt: {
         [lte]: day+ " 23:59:59.999+10" },
 }
 let result = await model.Order.findAll({where})
    result = result.map(order => {
        return new OrderDTO(order)
    })

    return result
}



module.exports={
    hello,
    changePosition,
    changeGroup,
    getBaseData,
    addImg,
    makeOrder,
    findOrder,
    deleteOrder,
    thisDayOrders
}