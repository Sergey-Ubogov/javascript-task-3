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
var WEEK_DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

function getTimeRegardingBank(oldDate, timeZone) {
    var dayInOldDate = oldDate.split(' ')[0];
    var newDate = new Date(Date.parse(CURRENT_MONTH + (WEEK_DAYS.indexOf(dayInOldDate) + 1) +
        CURRENT_YEAR + oldDate.split(' ')[1].split('+')[0] + ' GMT'));
    newDate.setUTCHours(newDate.getUTCHours() + timeZone);

    return newDate;
}

function searchCrossingInsideOrRight(friendBusyTime, currentFreeTime, freeTimes) {
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

    return currentFreeTime;
}

function searchCrossingLeft(friendBusyTime, currentFreeTime) {
    if (friendBusyTime.from <= currentFreeTime.begin &&
        friendBusyTime.to >= currentFreeTime.begin) {
        if (friendBusyTime.to >= currentFreeTime.end) {
            currentFreeTime.end = currentFreeTime.begin;
        } else {
            currentFreeTime.begin = friendBusyTime.to;
        }
    }

    return currentFreeTime;
}

function searchCrossing(friendBusyTime, currentFreeTime, freeTimes) {

    /*
    В этих функциях весь алгоритм: есть freeTimes - в начале это просто свободное время банка в
    ПН, ВТ и СР, в currentFreeTime находится свободное время в ПН, ВТ или СР. friendBusyTime - это
    время занятости какого-либо из друзей в какой либо день. Представим friendBusyTime как отрезок
    [f1, f2], currentFreeTime как отрезок [c1, c2], тогда, если f1<=c1 и f2>=c1, то есть
    пересечение слева у отрезка [c1, c2] или [c1, c2] содержится в [f1, f2]. Тогда [c1, c2]
    становится [f2, c2](левая граница сдвинулась) или [c1, c1](свободного времени нет в этот
    день). Если же f1>=c1 и f1 <= c2 то:
    1) если f2 >= c2 значит отрезок [c1, c2] имеет справа пересечение с отрезком [f1, f2] и тогда
        [c1, c2]становится [c1, f1]
    2) если f2<= c2 значит отрезок [f1, f2] содержится в [c1, c2] и тогда [c1, c2] разделяется на
        2 отрезка - [c1, f1] и [f2, c1]
    */
    currentFreeTime = searchCrossingLeft(friendBusyTime, currentFreeTime);
    currentFreeTime = searchCrossingInsideOrRight(friendBusyTime, currentFreeTime, freeTimes);

    return currentFreeTime;
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

    return goodDays;
}

function getTimeZoneRegardingBank(scheduleFriend, workingHours) {
    //  всё, что во времени находится после плюса является временной зоной
    return workingHours.from.split('+')[1] - scheduleFriend.from.split('+')[1];
}

function getWorkingTimeBank(goodDays, workingHours) {
    var COUNT_GOOD_DAYS = 3;
    for (var i = 1; i <= COUNT_GOOD_DAYS; i++) {
        var beginningBankWork = workingHours.from.split('+')[0];
        var endingBankWork = workingHours.to.split('+')[0];
        goodDays.push({
            begin: new Date(Date.parse(CURRENT_MONTH + i + CURRENT_YEAR +
                beginningBankWork + ' GMT')),
            end: new Date(Date.parse(CURRENT_MONTH + i + CURRENT_YEAR +
                endingBankWork + ' GMT'))
        });
    }

    return goodDays;
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    var copySchedule = [];
    var timeZoneFriend = 0;
    for (var friend in schedule) {
        if (schedule.hasOwnProperty(friend)) {
            copySchedule = copySchedule.concat(schedule[friend]);
        }
    }
    copySchedule = copySchedule.map(function (scheduleFriend) {
        timeZoneFriend = getTimeZoneRegardingBank(scheduleFriend, workingHours);

        return {
            from: getTimeRegardingBank(scheduleFriend.from, timeZoneFriend),
            to: getTimeRegardingBank(scheduleFriend.to, timeZoneFriend)
        };
    });
    var goodDays = [];
    goodDays = getWorkingTimeBank(goodDays, workingHours);
    goodDays = freeTimeSearch(goodDays, copySchedule);
    goodDays.sort(function (a, b) {
        return a.begin - b.begin;
    });
    var SECOND_AND_MILLISECOND = 60 * 1000;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            var find = false;
            goodDays.forEach(function (goodTime) {
                if ((goodTime.end - goodTime.begin) / SECOND_AND_MILLISECOND >= duration &&
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
                    if ((goodTime.end - goodTime.begin) / SECOND_AND_MILLISECOND >= duration &&
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
                template = template.replace('%DD', WEEK_DAYS[timeRobbery.getUTCDay() - 1]);

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
