/**
 * @file "回忆"页面
 * @author Trick 2022-04-09
 */
const app = getApp();
const QQMapWX = require('../../utils/qqmap-wx-jssdk.js'); // 获取当前位置
var qqmapsdk;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    showPopup: false, // 是否显示弹出窗口(true可以防止弹窗穿透)
    showRandomJokeView: false, // 是否显示随机笑话
    randomJoke: '', // 随机笑话
    notice: wx.getStorageSync('notice') ? wx.getStorageSync('notice') : '', // 公告栏数据(最多40个汉字,尽量20个以内)
    memorySum: wx.getStorageSync('memorySum') ? wx.getStorageSync('memorySum') : 0, // 回忆总数
    memoryList: wx.getStorageSync('memoryList') ? wx.getStorageSync('memoryList') : [], // 回忆列表
    showMemoryInfo: false, // 是否显示回忆信息
    memoryInfo: {}, // 详细的回忆信息
    showAddMemory: false, // 是否显示添加回忆
    addMemory: {
      title: '',
      localPicPathList: [],
      content: '',
      cloudPicPathList: [],
      id: 0,
      date: '',
      address: '',
      simpleAddress: ''
    }, // 添加的回忆内容
  },

  recordMemoryState: false, // 记录回忆状态(防止两次点击记录回忆)
  reachBottomState: false, // 上拉触底状态(防止多次上拉)

  /**
   * 页面创建时执行
   */
  async onLoad() {
    let that = this;
    wx.showShareMenu();
    qqmapsdk = new QQMapWX({
      key: '3XKBZ-WP4CG-KQVQM-IJ2WK-7QAE7-2ZFKZ' // 腾讯位置服务密钥
    })
    wx.showLoading({
      title: '载入回忆中',
      mask: true
    })
    await that.getMemoryList(0);
    wx.hideLoading();
    that.getNotice();
  },

  /**
   * 页面出现在前台时执行
   */
  onShow() {},

  /**
   * 页面从前台变为后台时执行
   */
  onHide() {},

  /**
   * 页面被用户分享时执行
   */
  onShareAppMessage() {
    return {
      title: '记你所记 想你所想',
      path: '/pages/memory/memory',
      imageUrl: '/images/img_logo.png'
    };
  },

  /**
   * 触发下拉刷新时执行
   */
  async onPullDownRefresh() {
    let that = this;
    that.getNotice();
    await that.getMemoryList(0);
    wx.stopPullDownRefresh();
  },

  /**
   * 触发上拉触底时执行
   */
  async onReachBottom() {
    let that = this;
    let currentIndex = that.data.memoryList.length;

    if (currentIndex === that.data.memorySum || that.reachBottomState) return;
    that.reachBottomState = true;
    await that.getMemoryList(currentIndex);
    that.reachBottomState = false;
  },

  /**
   * 从云端获取回忆列表
   * @param {Number} currentIndex 每次只获取索引值后(云函数中配置)条数据
   */
  async getMemoryList(currentIndex) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'getMemoryList',
          data: {
            currentIndex: currentIndex
          }
        })
        .then(async res => {
          if (res.result && res.result.result) {
            let partialMemoryList = await that.downloadCloudPicToLocal(res.result.partialMemoryList);
            if (currentIndex === 0) {
              that.setData({
                memoryList: partialMemoryList,
                memorySum: res.result.memorySum
              })
              wx.setStorageSync('memoryList', partialMemoryList);
              wx.setStorageSync('memorySum', res.result.memorySum);
            } else {
              let memoryList = that.data.memoryList;
              memoryList = memoryList.concat(partialMemoryList);
              that.setData({
                memoryList: memoryList
              })
            }
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(error => {
          resolve(false);
        })
    });
    let result = await p;
    if (!result) that.showErrorTip();
  },

  /**
   * 下载云图片到本地(减少云存储的消耗)
   * @param {Array} memoryList 回忆列表
   * @return {Array} 处理后的回忆列表
   */
  async downloadCloudPicToLocal(memoryList) {
    let that = this;
    let proArr = []; // promise返回值数组
    if (memoryList.length === 0) return memoryList;
    let picPath = wx.getStorageSync('picPath');
    picPath = picPath ? JSON.parse(picPath) : {};
    for (let i = 0; i < memoryList.length; i++) {
      let cloudPicPathList = memoryList[i].cloudPicPathList;
      if (cloudPicPathList.length === 0) continue;
      for (let j = 0; j < cloudPicPathList.length; j++) {
        proArr.push(new Promise(async function (resolve, reject) {
          if (!cloudPicPathList[j]) {
            memoryList[i].localPicPathList[j] = "../../images/img_miss.png";
            resolve(true);
          }
          let cloudPicName = cloudPicPathList[j].slice(cloudPicPathList[j].lastIndexOf("/") + 1);
          if (picPath[cloudPicName]) {
            await wx.getImageInfo({
                src: picPath[cloudPicName]
              })
              .then(res => {
                memoryList[i].localPicPathList[j] = picPath[cloudPicName];
                resolve(true);
              })
              .catch(async (res) => {
                await wx.cloud.downloadFile({
                    fileID: cloudPicPathList[j]
                  })
                  .then(res => {
                    memoryList[i].localPicPathList[j] = res.tempFilePath;
                    picPath[cloudPicName] = res.tempFilePath;
                    resolve(true);
                  })
                  .catch(res => {
                    memoryList[i].localPicPathList[j] = "../../images/img_miss.png";
                    resolve(true);
                  })
              })
          } else {
            await wx.cloud.downloadFile({
                fileID: cloudPicPathList[j]
              })
              .then(res => {
                memoryList[i].localPicPathList[j] = res.tempFilePath;
                picPath[cloudPicName] = res.tempFilePath;
                resolve(true);
              })
              .catch(res => {
                memoryList[i].localPicPathList[j] = "../../images/img_miss.png";
                resolve(true);
              })
          }
        }))
      }
    }
    await Promise.all(proArr).then(res => {
      wx.setStorageSync('picPath', JSON.stringify(picPath));
    }).catch(err => {})
    return memoryList;
  },

  /**
   * 获取公告
   */
  getNotice() {
    let that = this;
    wx.cloud.callFunction({
        name: 'getNotice'
      })
      .then(res => {
        if (res.result && res.result.result) {
          that.setData({
            notice: res.result.notice
          })
          wx.setStorageSync('notice', res.result.notice);
        }
      })
      .catch(error => {})
  },

  /**
   * 点击回忆
   * @param {Object} e 点击事件的对象
   */
  onClickMemory(e) {
    let that = this;
    let memoryInfo = e.currentTarget.dataset.data; // 点击的回忆数据
    that.setData({
      showMemoryInfo: true,
      showPopup: true,
      memoryInfo: memoryInfo
    })
  },

  /**
   * 预览回忆图片
   * @param {Object} e 当前点击的对象
   */
  onPreviewPic(e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: that.data.memoryInfo.localPicPathList[index],
      urls: that.data.memoryInfo.localPicPathList
    })
  },

  /**
   * 触碰回忆详情页蒙版
   * @param {Object} e 点击事件的对象
   */
  onClickMemoryMask(e) {
    let that = this;
    that.setData({
      showMemoryInfo: false,
      showPopup: false,
      memoryInfo: {}
    })
  },

  /**
   * 点击编辑回忆
   * @param {Object} e 点击事件的对象
   */
  onClickEditorMemory(e) {
    let that = this;
    let memoryId = e.currentTarget.dataset.id; // 点击的回忆id
    let memoryTitle = e.currentTarget.dataset.title; // 点击的回忆标题
    wx.showActionSheet({
      itemList: ['删除该回忆'],
      success(res) {
        if (res.tapIndex == 0) that.deleteMemory(memoryId, memoryTitle);
      },
      fail(res) {
        // 点取消或空白处
      }
    })
  },

  /**
   * 删除回忆
   * @param {Number} memoryId 回忆Id
   * @param {String} memoryTitle 回忆标题
   */
  deleteMemory(memoryId, memoryTitle) {
    let that = this;
    wx.showModal({
      title: '温馨提示',
      content: '是否删除《' + memoryTitle + '》这篇回忆',
      cancelText: '取消',
      confirmText: '确定',
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
            mask: true
          })
          wx.cloud.callFunction({
              name: 'deleteMemory',
              data: {
                memoryId: memoryId
              },
            })
            .then(res => {
              if (res.result && res.result.result) {
                let memoryList = that.data.memoryList;
                let memorySum = that.data.memorySum;
                let deleteMemory = memoryList.find(function (object) {
                  return object.id == memoryId;
                })
                let deleteMemoryIndex = memoryList.findIndex(function (object) {
                  return object.id == memoryId;
                })
                let cloudPicPathList = deleteMemory.cloudPicPathList;
                let picPath = wx.getStorageSync('picPath');
                picPath = picPath ? JSON.parse(picPath) : {};
                for (let i = 0; i < cloudPicPathList.length; i++) {
                  let cloudPicName = cloudPicPathList[i].slice(cloudPicPathList[i].lastIndexOf("/") + 1);
                  delete picPath[cloudPicName];
                }
                wx.setStorageSync('picPath', JSON.stringify(picPath));
                memoryList.splice(deleteMemoryIndex, 1);
                memorySum = memorySum - 1;
                that.setData({
                  memoryList: memoryList,
                  memorySum: memorySum
                })
                wx.setStorageSync('memoryList', memoryList.slice(0, 15));
                wx.setStorageSync('memorySum', memorySum);
                wx.hideLoading();
                wx.showToast({
                  title: '删除成功',
                  icon: 'none',
                  duration: 1500
                })
              } else {
                wx.hideLoading();
                that.showErrorTip();
              }
            })
            .catch(error => {
              wx.hideLoading();
              that.showErrorTip();
            })
        }
      }
    })
  },

  /**
   * 点击添加回忆
   */
  onClickAddMemory() {
    let that = this;
    that.setData({
      showPopup: true,
      showAddMemory: true
    })
  },

  /**
   * 点击返回回忆页
   */
  onClickBackMemory() {
    let that = this;
    wx.showModal({
        title: '温馨提示',
        content: '返回会清空当前所记回忆',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(res => {
        if (res.confirm) {
          that.setData({
            showPopup: false,
            showAddMemory: false,
            [`${`addMemory.${'title'}`}`]: '',
            [`${`addMemory.${'localPicPathList'}`}`]: [],
            [`${`addMemory.${'content'}`}`]: ''
          })
        }
      })
  },

  /**
   * 添加回忆的标题
   * @param {Object} e 当前点击的对象
   */
  addMemoryTitle(e) {
    let that = this;
    that.setData({
      [`${`addMemory.${'title'}`}`]: e.detail.value
    })
  },

  /**
   * 点击添加图片
   */
  onClickAddPic() {
    let that = this;
    let localPicPathList = that.data.addMemory.localPicPathList;
    if (localPicPathList.length >= 5) {
      wx.showToast({
        title: '图片最多记录5张',
        icon: 'none',
        duration: 1500
      });
    } else {
      let imgCount = 5 - localPicPathList.length;
      wx.chooseMedia({
        count: imgCount,
        mediaType: ['image'],
        sourceType: ['album'],
        sizeType: ['compressed'],
        success(res) {
          let tempFiles = res.tempFiles;
          for (let i = 0; i < tempFiles.length; i++) {
            localPicPathList.push(tempFiles[i].tempFilePath);
          }
          that.setData({
            [`${`addMemory.${'localPicPathList'}`}`]: localPicPathList
          })
        }
      })
    }
  },

  /**
   * 预览添加的回忆图片
   * @param {Object} e 当前点击的对象
   */
  onPreviewAddPic(e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: that.data.addMemory.localPicPathList[index],
      urls: that.data.addMemory.localPicPathList
    })
  },

  /**
   * 删除已添加的回忆图片
   * @param {object} e 当前点击的对象
   */
  onClickDeletePic(e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    let localPicPathList = that.data.addMemory.localPicPathList;
    localPicPathList.splice(index, 1);
    that.setData({
      [`${`addMemory.${'localPicPathList'}`}`]: localPicPathList
    })
  },

  /**
   * 添加回忆的内容
   * @param {Object} e 当前点击的对象
   */
  addMemoryContent(e) {
    let that = this;
    that.setData({
      [`${`addMemory.${'content'}`}`]: e.detail.value
    })
  },

  /**
   * 点击记录回忆
   */
  async onClickRecordMemory() {
    let that = this;
    let memoryTitle = that.data.addMemory.title;
    let memoryContent = that.data.addMemory.content;

    if (memoryTitle == '') {
      wx.showToast({
        title: '回忆标题不能为空',
        icon: 'none',
        duration: 1500
      })
      return;
    }
    if (that.recordMemoryState == true) return;
    that.recordMemoryState = true;
    wx.showModal({
        title: '温馨提示',
        content: '确定记录这篇回忆了吗',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '记录中...',
            mask: true
          })
          that.recordMemoryState = false;
          if (!await that.checkMsgSec(memoryTitle)) {
            wx.hideLoading();
            wx.showModal({
              showCancel: false,
              title: '温馨提示',
              content: '回忆标题存在违规信息',
              confirmText: '确定'
            })
            return;
          }
          if (memoryContent && !await that.checkMsgSec(memoryContent)) {
            wx.hideLoading();
            wx.showModal({
              showCancel: false,
              title: '温馨提示',
              content: '回忆内容存在违规信息',
              confirmText: '确定'
            })
            return;
          }
          that.startAddMemory();
        } else {
          that.recordMemoryState = false;
        }
      })
  },

  /**
   * 检测内容是否合规
   * @param {String} context 检测的内容
   */
  async checkMsgSec(context) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'checkMsgSec',
          data: {
            content: context
          },
        })
        .then(res => {
          if (res.result && res.result.result && res.result.data && res.result.data.errCode == 0) {
            if (res.result.data.result && res.result.data.result.suggest == 'pass') resolve(true);
            else resolve(false);
          } else {
            resolve(false);
          }
        })
        .catch(error => {
          resolve(false);
        })
    });
    return await p;
  },

  /**
   * 开始添加回忆
   */
  async startAddMemory() {
    let that = this;
    let localPicPathList = that.data.addMemory.localPicPathList;
    if (localPicPathList.length !== 0) await that.uploadLocalPicList();
    await that.getCurrentAddressInfo();
    await that.getCurrentDate();

    let addMemory = that.data.addMemory;

    await that.uploadMemory(addMemory);
    that.finishAddMemory();
  },

  /**
   * 上传本地图片列表
   */
  async uploadLocalPicList() {
    let that = this;
    let proArr = []; // promise返回值数组
    let localPicPathList = that.data.addMemory.localPicPathList;
    let cloudPicPathList = [];
    let currentInfo = await that.getOpenId();
    for (let i = 0; i < localPicPathList.length; i++) {
      proArr[i] = new Promise(async function (resolve, reject) {
        wx.compressImage({
            src: localPicPathList[i]
          })
          .then(res => {
            wx.cloud.uploadFile({
                cloudPath: currentInfo.openId + '/' + currentInfo.date + i + '.jpg', // 上传至云端的路径
                filePath: res.tempFilePath, // 上传的临时文件路径
              })
              .then(res => {
                cloudPicPathList[i] = res.fileID;
                resolve(true);
              })
              .catch(error => {
                cloudPicPathList[i] = "";
                resolve(true);
              })
          })
      })
    }
    await Promise.all(proArr).then((res) => {
      //全都图片都上传成功后
      that.setData({
        [`${`addMemory.${'cloudPicPathList'}`}`]: cloudPicPathList
      })
    }).catch((err) => {})
  },

  /**
   * 获取用户当前地址信息
   */
  async getCurrentAddressInfo() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.startLocationUpdate().then(res => {
          wx.onLocationChange(async (res) => {
            await that.getCurrentLocation(res.latitude, res.longitude)
            wx.offLocationChange();
            wx.stopLocationUpdate();
            resolve(true);
          })
        })
        .catch(err => {
          resolve(false);
        })
    })

    await p;
  },

  /**
   * 获取用户当前位置信息
   * @param {String} latitude 纬度
   * @param {String} longitude 经度
   */
  async getCurrentLocation(latitude, longitude) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      qqmapsdk.reverseGeocoder({
        location: {
          latitude: latitude,
          longitude: longitude
        },
        async success(res) {
          if (res && res.result) {
            let address = res.result.address ? res.result.address : ''; // 详细地址
            let city = res.result.ad_info.city ? res.result.ad_info.city : ''; // 城市
            let district = res.result.ad_info.district ? res.result.ad_info.district : ''; // 区
            let simpleAddress = district ? district : city; // 简易地址
            if (district != '') await that.getCurrentWeather(district, address, simpleAddress); // 获取当前位置天气
            else if (city != '') await that.getCurrentWeather(city, address, simpleAddress);
            resolve(true);
          } else {
            resolve(false);
          }
        }
      })
    })

    await p;
  },

  /**
   * 获取用户当前天气信息
   * @param {String} location 位置信息
   * @param {String} address 详细地址
   * @param {String} simpleAddress 简易地址
   */
  async getCurrentWeather(location, address, simpleAddress) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.request({
        url: 'https://free-api.heweather.net/s6/weather/now',
        data: {
          location: location,
          key: "2ce65b27e7784d0f85ecd7b8127f5e2d"
        },
        success(res) {
          let weather = res.data.HeWeather6[0].now.cond_txt ? res.data.HeWeather6[0].now.cond_txt : '';
          let temperature = res.data.HeWeather6[0].now.fl ? res.data.HeWeather6[0].now.fl + '℃' : '';
          that.setData({
            [`${`addMemory.${'address'}`}`]: address + ' ' + weather + ' ' + temperature,
            [`${`addMemory.${'simpleAddress'}`}`]: simpleAddress + ' ' + weather + ' ' + temperature
          })
          resolve(true);
        },
        fail(err) {
          resolve(false);
        }
      })
    })

    await p;
  },

  /**
   * 获取当前日期
   */
  async getCurrentDate() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'getCurrentDate'
        })
        .then(res => {
          if (res.result && res.result.result) {
            let date = res.result.currentDate;
            let id = res.result.currentId;
            that.setData({
              [`${`addMemory.${'date'}`}`]: date,
              [`${`addMemory.${'id'}`}`]: id
            })
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(error => {
          resolve(false);
        })
    });
    let result = await p;
    if (!result) that.showErrorTip();
  },

  /**
   * 上传回忆
   * @param {Object} memory 回忆
   */
  async uploadMemory(memory) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'uploadMemory',
          data: {
            memory: memory
          }
        })
        .then(async (res) => {
          if (res.result && res.result.result) {
            let partialMemoryList = await that.downloadCloudPicToLocal(res.result.partialMemoryList);
            that.setData({
              memoryList: partialMemoryList,
              memorySum: res.result.memorySum
            })
            wx.setStorageSync('memoryList', partialMemoryList);
            wx.setStorageSync('memorySum', res.result.memorySum);
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(error => {
          resolve(false);
        })
    });
    let result = await p;
    if (!result) that.showErrorTip();
  },

  /**
   * 完成回忆的添加
   */
  finishAddMemory() {
    let that = this;
    let addMemory = {
      title: '',
      localPicPathList: [],
      content: '',
      cloudPicPathList: [],
      id: 0,
      date: '',
      address: '',
      simpleAddress: ''
    };
    that.setData({
      showAddMemory: false,
      showPopup: false,
      addMemory: addMemory
    })
    wx.hideLoading();
    wx.showToast({
      title: '记录成功',
      icon: 'none',
      duration: 400
    })
  },

  /**
   * 获取用户openId
   */
  async getOpenId() {
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'getOpenId'
        })
        .then(res => {
          if (res.result && res.result.result) {
            resolve(res.result);
          } else resolve(false);
        })
        .catch(error => {
          resolve(false);
        })
    });
    return await p;
  },

  /**
   * 点击随机笑话
   */
  onClickRandomJoke() {
    let that = this;
    wx.request({
      url: 'https://api.djapi.cn/joke/get',
      data: {
        limit: '1',
        cn_to_unicode: '1',
        token: '37555a616248cb486ca0e60c10eca164',
        datatype: 'json'
      },
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        that.setData({
          showRandomJokeView: true,
          showPopup: true,
          randomJoke: res.data.Result.content
        })
      },
      fail() {
        that.showErrorTip();
      }
    })
  },

  /**
   * 触碰随机笑话页蒙版
   * @param {Object} e 点击事件的对象
   */
  onClickRandomJokeMask(e) {
    let that = this;
    that.setData({
      showRandomJokeView: false,
      showPopup: false,
      randomJoke: ''
    })
  },

  /**
   * 显示错误提示
   */
  showErrorTip() {
    wx.showToast({
      title: '网络异常请重试',
      icon: 'error',
      duration: 2000
    })
  },
});