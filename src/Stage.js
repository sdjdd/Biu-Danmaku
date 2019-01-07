class Stage {
    /**
     * 创建新的弹幕轨道
     * @param {Number} height 轨道高度
     */
    constructor(height) {
        this.totalHeight = height
        this.tracks = [{
            top: 0,
            height: this.totalHeight,
            appear: 0,
            leave: 0,
            finish: 0,
        }]
    }

    /**
     * 模拟插入一条弹幕, 返回其 top 值
     * @param {Number} height 弹幕高度
     * @param {Number} appear 弹幕出现在观众视野中的 Unix 时间戳
     * @param {Number} leave 弹幕完全展示时的 Unix 时间戳
     * @param {Number} arrive 弹幕开始消失时的 Unix 时间戳
     * @param {Number} finish 弹幕完全消失时的 Unix 时间戳
     */
    insert(height, appear, leave, arrive, finish) {
        // 寻找标志位, 用于寻找可合并(满足时间要求但高度不够)的轨道.
        // 正在寻找时值为最初满足要求的轨道的 index, 未处于寻找状态时值为 -1
        let searching = -1
        // 所需高度
        let need = height
        // 最适合插入的轨道的 index, 当遍历完轨道列表后仍未找到满足要求的轨道时使用此轨道
        let best = 0
        for (let i = 0; i < this.tracks.length; i++) {
            let track = this.tracks[i]
            if (appear > track.leave) {
                // 新弹幕出现时旧弹幕已离开, 即新旧弹幕不会发生重叠
                if (arrive > track.finish) {
                    // 新弹幕到达终点时旧弹幕已结束, 即新旧弹幕不会发生碰撞(最佳插入位置)
                    if (need === track.height) {
                        // 当前轨道刚好满足高度需求
                        if (searching >= 0) {
                            // 正在寻找合适的轨道, 在前几次遍历中找到了满足时间要求但不满足高度要求的轨道
                            // 此时当前轨道与之前满足时间要求的所有轨道合并后刚好满足高度要求
                            // 若不在寻找中即为刚好有一个轨道满足时间及高度要求(弹幕高度一致下的最佳情况)

                            // 将当前轨道的 top 设置为第一个满足时间要求的轨道的 top
                            track.top = this.tracks[searching].top
                            // 调整其高度
                            track.height = height
                            // 合并轨道: 删除 '第一个满足时间要求的轨道' 到 '倒数第二个满足时间要求的轨道'
                            this.tracks.splice(searching, i - searching)
                        }
                        // 设置新的时间戳
                        track.appear = appear
                        track.leave = leave
                        track.finish = finish
                        return track.top
                    } else if (need < track.height) {
                        // 当前轨道高度大于所需高度
                        let top
                        if (searching >= 0) {
                            // 正在寻找合适的轨道

                            // 记录下最初满足时间要求的轨道的 top
                            top = this.tracks[searching].top
                            // 然后调整其高度和时间戳
                            this.tracks[searching].height = height
                            this.tracks[searching].appear = appear
                            this.tracks[searching].leave = leave
                            this.tracks[searching].finish = finish
                            // 合并轨道: 删除 '第一个满足时间要求的轨道' 到 '倒数第二个满足时间要求的轨道' >>>之间<<< 的轨道
                            // 将第一个满足时间要求的轨道作为插入轨道, 当前轨道用于保存合并后剩余的空间
                            this.tracks.splice(searching + 1, i - searching - 1)
                        } else {
                            // 未处于寻找状态, 即当前轨道满足时间要求且其高度大于所需高度

                            top = track.top
                            // 插入一个高度刚好的新轨道, 当前轨道用于保存剩余空间
                            this.tracks.splice(i, 0, {
                                top: track.top,
                                height: need,
                                appear: appear,
                                leave: leave,
                                finish: finish
                            })
                        }
                        // 调整当前轨道的 top 和高度, 时间戳保持不变
                        track.top += need
                        track.height -= need
                        return top
                    } else {
                        // 当前轨道高度不够
                        if (searching < 0) {
                            searching = i
                        }
                        // 尝试合并当前轨道, 所需高度减去当前轨道高度
                        need -= track.height
                    }
                } else {
                    // 当前轨道不满足时间要求, 重置搜寻状态和所需高度
                    searching = -1
                    need = height
                }
            } else {
                searching = -1
                need = height
            }
            if (this.tracks[i].appear < this.tracks[best].appear && this.tracks[i].height >= height) {
                // 当前轨道出现时间早于最适合插入的轨道, 将当前轨道设置为最合适插入的轨道
                best = i
            }
        }
        // 未找到完美插入位置, 将当前弹幕插入最合适的轨道
        need = height
        for (let i = best; i < this.tracks.length; i++) {
            let track = this.tracks[i]
            if (need === track.height) {
                if (i > best) {
                    track.top = this.tracks[best].top
                    track.height = height
                    this.tracks.splice(best, i - best)
                }
                track.appear = appear
                track.leave = leave
                track.finish = finish
                break
            } else if (need < track.height) {
                if (i > best) {
                    this.tracks[best].height = height
                    this.tracks[best].appear = appear
                    this.tracks[best].leave = leave
                    this.tracks[best].finish = finish
                    this.tracks.splice(best + 1, i - best - 1)
                } else {
                    this.tracks.splice(i, 0, {
                        top: track.top,
                        height: height,
                        appear: appear,
                        leave: leave,
                        finish: finish
                    })
                }
                track.top += need
                track.height -= need
                break
            } else {
                if (i === this.tracks.length - 1) {
                    this.tracks[best].height = this.totalHeight - this.tracks[best].top
                    this.tracks[best].appear = appear
                    this.tracks[best].leave = leave
                    this.tracks[best].finish = finish
                    this.tracks.splice(best + 1, i - best)
                    break
                }
                need -= track.height
            }
        }
        return this.tracks[best].top
    }

    /**
     * 同步各轨道的时间戳
     * @param {Number} value 同步值
     */
    syncTimestamps(value) {
        this.tracks.forEach(track => {
            track.appear += value
            track.leave += value
            track.finish += value
        })
    }

    /**
     * 调整 Stage 高度
     * @param {Number} height 新高度
     */
    adjustHeight(height) {
        let diff = this.totalHeight - height
        if (diff > 0) {
            while (this.tracks.length > 0 && diff !== 0) {
                let last = this.tracks[this.tracks.length - 1]
                if (last.height <= diff) {
                    this.tracks.pop()
                    diff -= last.height
                } else {
                    last.height -= diff
                    diff = 0
                }
            }
        } else if (diff < 0) {
            this.tracks.push({
                top: this.totalHeight,
                height: -diff,
                appear: 0,
                leave: 0,
                finish: 0
            })
        }
        this.totalHeight = height
    }
}

export default Stage