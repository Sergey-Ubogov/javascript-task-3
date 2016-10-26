'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */

var CURRENT_YEAR = ' 2016 ';
var CURRENT_MONTH = '2 ';

function getTimeRegardingBank(oldTime, shift) {
    var weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    var dayInOldTime = oldTime.split(' ')[0];
    var newDate = new Date(Date.parse(CURRENT_MONTH + weekDays.indexOf(dayInOldTime) +
        CURRENT_YEAR + oldTime.split(' ')[1].split('+')[0] + ' GMT'));
    newDate.setUTCHours(newDate.getUTCHours() + shift);

    return newDate;
}

function crossingInsideOrRight(friendBusyTime, currentFreeTime, freeTimes) {
    if (friendBusyTime.from >= currentFreeTime.begin &&
        friendBusyTime.from <= currentFreeTime.end) {
        if (friendBusyTime.to >= currentFreeTime.end) {
            currentFreeTime.end = friendBusyTime.from;
        } else {
            var end = new Date(String(currentFreeTime.end));
            currentFreeTime.end = friendBusyTime.from;
            freeTimes.push({
                begin: friendBusyTime.to,
                end: end
            });
        }
    }
}

function crossingLeft(friendBusyTime, currentFreeTime) {
    if (friendBusyTime.from <= currentFreeTime.begin &&
        friendBusyTime.to >= currentFreeTime.begin) {
        if (friendBusyTime.to >= currentFreeTime.end) {
            currentFreeTime.end = currentFreeTime.begin;
        } else {
            currentFreeTime.begin = friendBusyTime.to;
        }
    }
}

function searchCrossing(friendBusyTime, currentFreeTime, freeTimes) {
    crossingLeft(friendBusyTime, currentFreeTime);
    crossingInsideOrRight(friendBusyTime, currentFreeTime, freeTimes);
}

function copyScheduleFriends(friendSchedule, copyFriendSchedule, timeZoneWithBank) {
    friendSchedule.forEach(function (busyTime) {
        copyFriendSchedule.push(
            {
                from: getTimeRegardingBank(busyTime.from, timeZoneWithBank),
                to: getTimeRegardingBank(busyTime.to, timeZoneWithBank)
            });
    });
}

function freeTimeSearch(goodDays, copySchedule) {
    var indexGoodDay = 0;
    while (indexGoodDay < goodDays.length) {
        var indexScheduleFriend = 0;
        while (indexScheduleFriend < copySchedule.length) {
            searchCrossing(copySchedule[indexScheduleFriend], goodDays[indexGoodDay], goodDays);
            indexScheduleFriend++;
        }
        indexGoodDay++;
    }
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    var copySchedule = [];
    var timeZoneFriend = 0;
    for (var friend in schedule) {
        if (schedule.hasOwnProperty(friend)) {
            timeZoneFriend = schedule[friend].length !== 0
                ? Number(schedule[friend][0].from.split('+')[1]) : 0;
            copyScheduleFriends(schedule[friend],
                copySchedule, Number(workingHours.from.split('+')[1]) - timeZoneFriend);
        }
    }
    var goodDays = [];
    var COUNT_GOOD_DAYS = 3;
    for (var i = 1; i <= COUNT_GOOD_DAYS; i++) {
        goodDays.push({
            begin: new Date(Date.parse(CURRENT_MONTH + i + CURRENT_YEAR +
                workingHours.from.split('+')[0] + ' GMT')),
            end: new Date(Date.parse(CURRENT_MONTH + i + CURRENT_YEAR +
                workingHours.to.split('+')[0] + ' GMT'))
        });
    }
    freeTimeSearch(goodDays, copySchedule);
    goodDays.sort(function (a, b) {
        return a.begin - b.begin;
    });
    //  var copyGoodDays = [];

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            var find = false;
            var MILLISECOND_AND_SECOND = 1000 * 60;
            goodDays.forEach(function (goodTime) {
                if ((goodTime.end - goodTime.begin) / MILLISECOND_AND_SECOND >= duration &&
                    !find && duration > 0) {
                    find = true;
                }
            });

            return find;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (this.exists()) {
                var timeRobbery = false;
                goodDays.forEach(function (goodTime) {
                    if ((goodTime.end - goodTime.begin) / (60 * 1000) >= duration &&
                        duration > 0 && !timeRobbery) {
                        timeRobbery = goodTime.begin;
                    }
                });
                var hours = timeRobbery.getUTCHours();
                var minutes = timeRobbery.getUTCMinutes();
                hours = hours < 10 ? '0' + hours : hours;
                minutes = minutes < 10 ? '0' + minutes : minutes;
                template = template.replace('%HH', hours);
                template = template.replace('%MM', minutes);
                var NUMBER_DAY_TO_NAME = {
                    1: 'ПН', 2: 'ВТ', 3: 'СР'
                };
                template = template.replace('%DD', NUMBER_DAY_TO_NAME[timeRobbery.getUTCDay()]);

                return template;
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {

            /*  if (!this.exists()) {
                return false;
            }
            copyGoodDays.forEach(function (goodDay) {
                goodDay.forEach(function (goodTime) {
                    if (String(find) === String(goodTime.begin)) {
                        goodTime.begin.setMinutes(goodTime.begin.getUTCMinutes() + 30);
                    }
                });
            });
            var findMore = false;
            copyGoodDays.forEach(function (goodDay) {
                goodDay.forEach(function (goodTime) {
                    if ((goodTime.end - goodTime.begin) / (60 * 1000) >= duration && !findMore) {
                        findMore = goodTime.begin;
                    }
                });
            });
            if (findMore) {
                find = findMore;
                return true;
            }
            copyGoodDays.forEach(function (goodDay) {
                goodDay.forEach(function (goodTime) {
                    if (String(find) === String(goodTime.begin)) {
                        goodTime.begin.setMinutes(goodTime.begin.getUTCMinutes() - 30);
                    }
                });
            });*/

            return false;
        }
    };
};
