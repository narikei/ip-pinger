const _ = require('lodash');
const ping = require('ping');

(() => {
  let ipItems = {};

  const form = document.querySelector('.form');
  const result = document.querySelector('.result');
  const tbody = result.querySelector('tbody');

  const input01 = form.querySelector('input[name=ip-01]');
  const input02 = form.querySelector('input[name=ip-02]');
  const input03 = form.querySelector('input[name=ip-03]');
  const input04 = form.querySelector('input[name=ip-04]');

  const loadStorage = () => {
    input01.value = localStorage.getItem('input01') || '127';
    input02.value = localStorage.getItem('input02') || '0';
    input03.value = localStorage.getItem('input03') || '0';
    input04.value = localStorage.getItem('input04') || '1';
  };
  loadStorage();

  const saveStorage = () => {
    localStorage.setItem('input01', input01.value);
    localStorage.setItem('input02', input02.value);
    localStorage.setItem('input03', input03.value);
    localStorage.setItem('input04', input04.value);
  };


  const clearButton = form.querySelector('.clear');
  clearButton.addEventListener('click', (e) => {
    e.preventDefault();

    ipItems = {};

    const rows = tbody.querySelectorAll('tr');
    _.each(rows, (row) => {
      row.remove();
    });
  });


  const displayTime = (unixTime) => {
    if (!unixTime) {
      return '';
    }

    const date = new Date(unixTime);
    const diff = new Date().getTime() - date.getTime();
    const d = new Date(diff);

    if (d.getUTCFullYear() - 1970) {
      return `${d.getUTCFullYear() - 1970}年前`;
    } if (d.getUTCMonth()) {
      return `${d.getUTCMonth()}ヶ月前`;
    } if (d.getUTCDate() - 1) {
      return `${d.getUTCDate() - 1}日前`;
    } if (d.getUTCHours()) {
      return `${d.getUTCHours()}時間前`;
    } if (d.getUTCMinutes()) {
      return `${d.getUTCMinutes()}分前`;
    }
    return `${d.getUTCSeconds()}秒前`;
  };

  const checkIp = (item, next) => {
    if (item.isChecking) {
      return;
    }

    item.isChecking = true;
    ping.sys.probe(item.ip, (isAlive) => {
      item.isChecking = false;
      item.isAlive = isAlive;

      if (item.isAlive) {
        item.lastCheckedAt = _.now();
        item.succeedCount += 1;
      } else {
        item.missedCount += 1;
      }
      next();
    });
  };

  const generateNumbers = (value) => {
    const numbers = [];

    const s = _.split(value, /,|\s|\|/g);
    s.forEach((v) => {
      if (!v) {
        return;
      }

      const a = _.split(v, /-|~|_/g);
      if (a.length === 1) {
        numbers.push(a[0]);
      }

      if (a.length === 2) {
        const d = _.range(Number(a[0]), Number(a[1]) + 1);
        d.forEach((e) => {
          numbers.push(e);
        });
      }
    });

    return numbers;
  };

  const generateIpList = (ip01, ip02, ip03, ip04) => {
    const ip1s = generateNumbers(ip01);
    const ip2s = generateNumbers(ip02);
    const ip3s = generateNumbers(ip03);
    const ip4s = generateNumbers(ip04);

    const ips = [];

    _.map(ip1s, (num01) => {
      _.map(ip2s, (num02) => {
        _.map(ip3s, (num03) => {
          _.map(ip4s, (num04) => {
            const ip = `${num01}.${num02}.${num03}.${num04}`;
            ips.push(ip);
          });
        });
      });
    });

    return ips;
  };

  const updateRow = (item) => {
    const update = (element, value) => {
      if (element.innerHTML === value) {
        return;
      }
      element.innerHTML = value;
    };

    const cols = item.row.querySelectorAll('td');
    update(cols[0], item.ip);
    update(cols[1], item.isAlive);
    update(cols[2], displayTime(item.lastCheckedAt));
    update(cols[3], item.succeedCount);
    update(cols[4], item.missedCount);
  };

  setInterval(() => {
    const ip01 = input01.value;
    const ip02 = input02.value;
    const ip03 = input03.value;
    const ip04 = input04.value;
    saveStorage();

    if (!(ip01 && ip02 && ip03 && ip04)) {
      return;
    }

    const ips = generateIpList(ip01, ip02, ip03, ip04);
    _.each(ips, (ip) => {
      const item = ipItems[ip];
      if (item) {
        return;
      }

      const row = document.createElement('tr');
      _.each(_.range(0, 6), () => {
        const td = document.createElement('td');
        row.appendChild(td);
      });
      row.addEventListener('click', () => {
        row.classList.toggle('is-mark');
      });


      ipItems[ip] = {
        ip,
        isAlive: null,
        isChecking: false,
        lastCheckedAt: null,
        succeedCount: 0,
        missedCount: 0,
        row,
      };

      tbody.appendChild(row);
    });

    _.each(ipItems, (item) => {
      checkIp(item, () => {
        console.log(item.ip, item.isAlive);
      });
      updateRow(item);
    });
  }, 1000);
})();
