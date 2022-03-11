const cloud = require('wx-server-sdk');

cloud.init();

const db = cloud.database();
const _ = db.command;
const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : `0${n}`;
}

function formatTime(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`;
}

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    let wishDoc = await db.collection('wish').where({
      _openid: wxContext.OPENID
    }).get();
    let wishList = wishDoc.data[0].wishList;
    let wishIndex = wishList.findIndex(function (object) {
      return object.id == event.wishId;
    })

    if (event.type == "delete") {
      wishList.splice(wishIndex, 1);
    } else if (event.type == "finish") {
      let finishWish = wishList[wishIndex];
      finishWish.state = true;
      finishWish.finishDate = formatTime(new Date());
      wishList.splice(wishIndex, 1);
      wishList[wishList.length] = finishWish;
    } else if (event.type == "unfinish") {
      let unfinishWish = wishList[wishIndex];
      let addState = false;
      unfinishWish.state = false;
      unfinishWish.finishDate = '';
      wishList.splice(wishIndex, 1);
      if (wishList.length) {
        for (let i = 0; i < wishList.length; i++) {
          if (wishList[i].state == true || unfinishWish.id > wishList[i].id) {
            wishList.splice(i, 0, unfinishWish);
            addState = true;
            break;
          }
        }
        if(!addState) wishList.push(unfinishWish);
      } else {
        wishList.push(unfinishWish);
      }
    }
    await db.collection('wish').where({
      _openid: wxContext.OPENID
    }).update({
      data: {
        wishList: wishList
      }
    })
    return {
      result: true,
      wishList: wishList
    }
  } catch (e) {
    return {
      result: false,
      errMsg: e
    }
  }
}