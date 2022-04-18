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
    let updateWishIndex = wishList.findIndex(function (object) {
      return object.id == event.wishId;
    })
    let updateWish = wishList[updateWishIndex];

    if (event.wishState === 2) {
      wishList.splice(updateWishIndex, 1);
    } else if (event.wishState === 1) {
      updateWish.state = true;
      updateWish.finishDate = formatTime(new Date());
      wishList.splice(updateWishIndex, 1);
      wishList[wishList.length] = updateWish;
    } else if (event.wishState === 0) {
      let addState = false;
      updateWish.state = false;
      updateWish.finishDate = '';
      wishList.splice(updateWishIndex, 1);
      if (wishList.length) {
        for (let i = 0; i < wishList.length; i++) {
          if (wishList[i].state === true || updateWish.id > wishList[i].id) {
            wishList.splice(i, 0, updateWish);
            addState = true;
            break;
          }
        }
        if (!addState) wishList.push(updateWish);
      } else {
        wishList.push(updateWish);
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
      updateWish: updateWish,
      wishSum: wishList.length
    }
  } catch (e) {
    return {
      result: false,
      errMsg: e
    }
  }
}