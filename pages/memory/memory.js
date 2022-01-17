/**
 * Page: memory
 * Author: Trick
 * Date: 2022-01-17
 */
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    noticeData: "公告内容", // 公告栏数据(最多40个汉字,尽量20个以内)
    memorySum: 1, // 回忆总数
    memoryList: [{
      id: 10212, // 回忆唯一id
      title: "回忆标题", // (15个汉字以内)
      content: "回忆内容",
      localPicPathList: ["../../images/img_add.png"],
      cloudPicPathList: ["../../images/img_add.png"],
      date: "2022-01-12 21:58:50",
      address: "浙江省宁波市鄞州区渔源路666号 多云 1℃",
      simpleAddress: "鄞州区 多云 1℃"
    }], // 回忆列表
  },

  /**
   * 页面创建时执行
   */
  onLoad() {},

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
  onShareAppMessage() {},

  /**
   * 触发下拉刷新时执行
   */
  onPullDownRefresh() {},

  /**
   * 点击回忆排序
   */
  onClickMemorySort() {
    console.log("点击回忆排序");
  },

  /**
   * 点击回忆
   * @param {object} e 点击事件的对象
   */
  onClickMemory(e) {
    let memoryData = e.currentTarget.dataset.data; // 点击的回忆数据
    let memoryIndex = e.currentTarget.dataset.index; // 点击的回忆索引
    console.log("点击回忆" + memoryIndex);
  },

  /**
   * 点击添加回忆
   */
  onClickAddMemory() {
    console.log("点击添加回忆");
  },

  /**
   * 点击编辑回忆
   * @param {object} e 点击事件的对象
   */
  onClickEditorMemory(e) {
    let memoryId = e.currentTarget.dataset.id; // 点击的回忆id
    console.log("点击编辑回忆:" + memoryId);
  }
});