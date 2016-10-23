'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */

function getNextDay(currentDay) {
    var nextDay = { 'ПН': 'ВТ', 'ВТ': 'СР', 'СР': 'ЧТ', 'ЧТ': 'ПТ',
    'ПТ': 'СБ', 'СБ': 'ВС', 'ВС': 'ПН' };

    return nextDay[currentDay];
}

function getYesterday(currentDay) {
    var yesterday = { 'ПН': 'ВС', 'ВТ': 'ПН', 'СР': 'ВТ', 'ЧТ': 'СР',
    'ПТ': 'ЧТ', 'СБ': 'ПТ', 'ВС': 'СБ' };

    return yesterday[currentDay];
}

function setTimeRegardingBank(oldTime, shift) {
    var hours = Number(oldTime.split(' ')[1].split(':')[0]);
    var nameDayToNumber = {
        'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6, 'ВС': 7
    };
    var day = oldTime.split(' ')[0];
    if (hours + shift >= 24) {
        hours = hours + shift - 24;
        day = getNextDay(day);
    } else if (hours + shift < 0) {
        hours = 24 + hours + shift;
        day = getYesterday(day);
    } else {
        hours = hours + shift;
    }
    if (String(hours).length === 1) {
        hours = '0' + String(hours);
    }
    var newDate = new Date(0, 0, nameDayToNumber[day], hours, oldTime.split(':')[1].split('+')[0]);

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

function getFreeTimeForFriend(friend, currentFreeTime, goodDay) {
    friend.forEach(function (friendBusyTime) {
        freeTimeSearch(friendBusyTime, currentFreeTime, goodDay);
    });
}

function copyScheduleFriends(friendSchedule, copyFriendShedule, timeZoneWithBank) {
    friendSchedule.forEach(function (busyTime) {
        copyFriendShedule.push(
            {
                from: setTimeRegardingBank(busyTime.from, timeZoneWithBank),
                to: setTimeRegardingBank(busyTime.to, timeZoneWithBank)
            });
    });
}
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    var timeZoneBank = Number(workingHours.from.split('+')[1]);
    var timeZone = {
        Danny: Number(schedule.Danny[0].from.split('+')[1]),
        Rusty: Number(schedule.Rusty[0].from.split('+')[1]),
        Linus: Number(schedule.Linus[0].from.split('+')[1])
    };
    var copyShedule = {
        Danny: [],
        Rusty: [],
        Linus: []
    };
    for (var friend in schedule) {
        if (schedule.hasOwnProperty(friend)) {
            copyScheduleFriends(schedule[friend],
                copyShedule[friend], timeZoneBank - timeZone[friend]);
        }
    }
    var goodDays = [[], [], []];
    for (var i = 1; i <= goodDays.length; i++) {
        goodDays[i - 1].push({ begin:
                            new Date(
                                0, 0, i, Number(workingHours.from.split(':')[0]),
                                Number(workingHours.from.split(':')[1].split('+')[0])
                            ),
                          end:
                            new Date(
                                0, 0, i, Number(workingHours.to.split(':')[0]),
                                Number(workingHours.to.split(':')[1].split('+')[0])
                            )
                        });
    }
    var find = false;
    var copyGoodDays = [];

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            find = false;
            var friends = [copyShedule.Danny, copyShedule.Rusty, copyShedule.Linus];
            goodDays.forEach(function (goodDay) {
                goodDay.forEach(function (currentFreeTime) {
                    friends.forEach(function (scheduleFriend) {
                        getFreeTimeForFriend(scheduleFriend, currentFreeTime, goodDay);
                    });
                });
            });
            copyGoodDays = [];
            goodDays.forEach(function (goodDay) {
                copyGoodDays.push([]);
                goodDay.forEach(function (goodTime) {
                    copyGoodDays[copyGoodDays.length - 1].push({
                        begin: new Date(String(goodTime.begin)),
                        end: new Date(String(goodTime.end))
                    });
                });
            });
            goodDays.forEach(function (goodDay) {
                goodDay.forEach(function (goodTime) {
                    if ((goodTime.end - goodTime.begin) / (60 * 1000) >= duration && !find) {
                        find = goodTime.begin;
                    }
                });
            });
            if (find) {
                return true;
            }

            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (find) {
                var hours = String(find.getHours());
                var minutes = String(find.getMinutes());
                if (hours.length === 1) {
                    hours = '0' + hours;
                }
                if (minutes.length === 1) {
                    minutes = '0' + minutes;
                }
                template = template.replace('%HH', hours);
                template = template.replace('%MM', minutes);
                var numberDayToName = {
                    1: 'ПН', 2: 'ВТ', 3: 'СР', 4: 'ЧТ', 5: 'ПТ', 6: 'СБ', 0: 'ВС'
                };
                template = template.replace('%DD', numberDayToName[find.getDay()]);

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
            if (!find) {
                this.exists();
            }
            copyGoodDays.forEach(function (goodDay) {
                goodDay.forEach(function (goodTime) {
                    if (String(find) === String(goodTime.begin)) {
                        goodTime.begin.setMinutes(goodTime.begin.getMinutes() + 30);
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
            find.setMinutes(find.getMinutes() - 30);

            return false;
        }
    };
};
