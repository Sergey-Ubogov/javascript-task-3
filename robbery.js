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
    var oldTimeZoneFriend = oldDate.split(' ')[1].split('+')[0];
    var newDate = new Date(Date.parse(CURRENT_MONTH + (WEEK_DAYS.indexOf(dayInOldDate) + 1) +
        CURRENT_YEAR + oldTimeZoneFriend + ' GMT'));
    newDate.setUTCHours(newDate.getUTCHours() + timeZone);

    return newDate;
}

function getCopyGoodDays(goodDays) {
    var copyGoodDays = goodDays.map(function (scheduleFriend) {
        return {
            begin: new Date(String(scheduleFriend.begin)),
            end: new Date(String(scheduleFriend.end))
        };
    });

    return copyGoodDays;
}

function searchCrossingInsideOrRight(friendBusyTime, indexGoodDay, goodDays) {
    var copyGoodDays = getCopyGoodDays(goodDays);
    if (friendBusyTime.from >= copyGoodDays[indexGoodDay].begin &&
        friendBusyTime.from <= copyGoodDays[indexGoodDay].end) {
        if (friendBusyTime.to >= copyGoodDays[indexGoodDay].end) {
            copyGoodDays[indexGoodDay].end = friendBusyTime.from;
        } else {
            var end = new Date(String(copyGoodDays[indexGoodDay].end));
            copyGoodDays[indexGoodDay].end = friendBusyTime.from;
            copyGoodDays.push({
                begin: friendBusyTime.to,
                end: end
            });
        }
    }

    return copyGoodDays;
}

function searchCrossingLeft(friendBusyTime, indexGoodDay, goodDays) {
    var copyGoodDays = getCopyGoodDays(goodDays);
    if (friendBusyTime.from <= copyGoodDays[indexGoodDay].begin &&
        friendBusyTime.to >= copyGoodDays[indexGoodDay].begin) {
        if (friendBusyTime.to >= copyGoodDays[indexGoodDay].end) {
            copyGoodDays[indexGoodDay].end = copyGoodDays[indexGoodDay].begin;
        } else {
            copyGoodDays[indexGoodDay].begin = friendBusyTime.to;
        }
    }

    return copyGoodDays;
}

function freeTimeSearch(goodDays, copySchedule) {
    var indexGoodDay = 0;
    while (indexGoodDay < goodDays.length) {
        var indexScheduleFriend = 0;
        while (indexScheduleFriend < copySchedule.length) {
            goodDays = searchCrossingLeft(copySchedule[indexScheduleFriend], indexGoodDay,
                goodDays);
            goodDays = searchCrossingInsideOrRight(copySchedule[indexScheduleFriend], indexGoodDay,
                goodDays);
            indexScheduleFriend++;
        }
        indexGoodDay++;
    }

    return goodDays;
}

function getTimeZoneRegardingBank(scheduleFriend, workingHours) {
    //  всё, что во времени находится после плюса является временной зоной
    var timeZoneBank = workingHours.from.split('+')[1];
    var timeZoneFriend = scheduleFriend.from.split('+')[1];

    return timeZoneBank - timeZoneFriend;
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
