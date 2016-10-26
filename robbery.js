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

var nameDayToNumber = {
    'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6, 'ВС': 7
};
function setTimeRegardingBank(oldTime, shift) {
    var day = oldTime.split(' ')[0];
    var newDate = new Date(Date.parse('1 ' + String(nameDayToNumber[day]) + ' 1906 ' +
        String(oldTime.split(' ')[1].split('+')[0]) + ' GMT'));
    newDate.setUTCHours(newDate.getUTCHours() + shift);

    return newDate;
}

function freeTimeSearch(friendBusyTime, currentFreeTime, freeTimes) {
    if (friendBusyTime.from <= currentFreeTime.begin &&
        friendBusyTime.to > currentFreeTime.begin) {
        if (friendBusyTime.to >= currentFreeTime.end) {
            currentFreeTime.begin = undefined;
            currentFreeTime.end = undefined;
        } else {
            currentFreeTime.begin = friendBusyTime.to;
        }
    }
    if (friendBusyTime.from > currentFreeTime.begin &&
        friendBusyTime.from < currentFreeTime.end) {
        if (friendBusyTime.to >= currentFreeTime.end) {
            currentFreeTime.end = friendBusyTime.from;
        } else {
            var end = currentFreeTime.end;
            currentFreeTime.end = friendBusyTime.from;
            freeTimes.push({
                begin: friendBusyTime.to,
                end: end
            });
        }
    }
}

function copyScheduleFriends(friendSchedule, copyFriendSchedule, timeZoneWithBank) {
    friendSchedule.forEach(function (busyTime) {
        copyFriendSchedule.push(
            {
                from: setTimeRegardingBank(busyTime.from, timeZoneWithBank),
                to: setTimeRegardingBank(busyTime.to, timeZoneWithBank)
            });
    });
}

function go(goodDays, copySchedule) {
    var ggg = 0;
    while (ggg < goodDays.length) {
        var mmm = 0;
        while (mmm < copySchedule.length) {
            freeTimeSearch(copySchedule[mmm], goodDays[ggg], goodDays);
            mmm++;
        }
        ggg++;
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
    for (var i = 1; i <= 3; i++) {
        goodDays.push({
            begin: new Date(Date.parse('1 ' + i + ' 1906 ' + workingHours.from.split('+')[0] +
                ' GMT+0')),
            end: new Date(Date.parse('1 ' + i + ' 1906 ' + workingHours.to.split('+')[0] +
                ' GMT+0'))
        });
    }
    go(goodDays, copySchedule);
    //  goodDays.forEach(function (goodDay) {

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
            goodDays.forEach(function (goodTime) {
                if ((goodTime.end - goodTime.begin) / (60 * 1000) >= duration && !find &&
                    goodTime.begin.getUTCDay() < 4) {
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
                        !timeRobbery) {
                        timeRobbery = goodTime.begin;
                    }
                });
                if (timeRobbery.getUTCDay() > 3) {
                    return '';
                }
                var hours = timeRobbery.getUTCHours();
                var minutes = timeRobbery.getUTCMinutes();
                hours = hours < 10 ? '0' + hours : hours;
                minutes = minutes < 10 ? '0' + minutes : minutes;
                template = template.replace('%HH', hours);
                template = template.replace('%MM', minutes);
                var numberDayToName = {
                    1: 'ПН', 2: 'ВТ', 3: 'СР'
                };
                template = template.replace('%DD', numberDayToName[timeRobbery.getUTCDay()]);

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
