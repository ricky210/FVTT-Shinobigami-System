
export class ShinobigamiActor extends Actor {

  prepareData() {
    super.prepareData();

  }

  /** @override */
  async _preUpdate(data, options, userId) {
    if ('system' in data && ('talent' in data.system || 'health' in data.system) ) {
      let health = JSON.parse(JSON.stringify(this.system.health.state));
      let dirty = JSON.parse(JSON.stringify(this.system.health.dirty));
      let table = JSON.parse(JSON.stringify(this.system.talent.table));
      let gap = JSON.parse(JSON.stringify(this.system.talent.gap));

      let overflowX = this.system.talent.overflowX;
      let overflowY = this.system.talent.overflowY;
      let yoma = this.system.talent.yoma;


      console.log(data);

      if ('talent' in data.system) {
        if ('table' in data.system.talent) {
          for (let a = 0; a < Object.keys(data.system.talent.table).length; ++a) {
            let i = Object.keys(data.system.talent.table)[a];
            for (let b = 0; b < Object.keys(data.system.talent.table[i]).length; ++b) {
              let j = Object.keys(data.system.talent.table[i])[b];
              for (let c = 0; c < Object.keys(data.system.talent.table[i][j]).length; ++c) {
                let key = Object.keys(data.system.talent.table[i][j])[c];
                table[i][j][key] = data.system.talent.table[i][j][key];
              }
            }
          }

        }

        if ('gap' in data.system.talent) {
          for (let a = 0; a < Object.keys(data.system.talent.gap).length; ++a) {
            let i = Object.keys(data.system.talent.gap)[a];
            gap[i] = data.system.talent.gap[i];
          }
        }

        if ('curiosity' in data.system.talent && data.system.talent.curiosity != 0) {
          gap = data.system.talent.gap = {"0": false, "1": false, "2": false, "3": false, "4": false, "5": false};

          data.system.talent.gap[data.system.talent.curiosity] = gap[data.system.talent.curiosity] = true;
          data.system.talent.gap[data.system.talent.curiosity - 1] = gap[data.system.talent.curiosity - 1] = true;
        }

        if ('overflowX' in data.system.talent)
          overflowX = data.system.talent.overflowX;
        if ('overflowY' in data.system.talent)
          overflowY = data.system.talent.overflowY;
        if ('yoma' in data.system.talent)
          yoma = data.system.talent.yoma;

      } else
        data.system.talent = {};

      if ('health' in data.system && ('state' in data.system.health || 'dirty' in data.system.health)) {
        let count = 0;
        if ('dirty' in data.system.health) {
          for (let a = 0; a < Object.keys(data.system.health.dirty).length; ++a) {
            let i = Object.keys(data.system.health.dirty)[a];
            dirty[i] = data.system.health.dirty[i];

            if (data.system.health.dirty[i])
              count -= 1;
            else
              count += 1;
          }
        }

        if ('state' in data.system.health) {
          for (let a = 0; a < Object.keys(data.system.health.state).length; ++a) {
            let i = Object.keys(data.system.health.state)[a];
            health[i] = data.system.health.state[i];

            if (data.system.health.state[i])
              count -= 1;
            else
              count += 1;
          }
        }

        data.system.health.value = ('value' in data.system.health) ? data.system.health.value + count : this.system.health.value + count;
      }

      if (!yoma) {
        for (let a = 0; a < Object.keys(dirty).length; ++a) {
          let i = Object.keys(dirty)[a];
          health[i] = dirty[i] ? dirty[i] : health[i];
        }
      } else
        health = {0: false, 1: false, 2: false, 3: false, 4: false, 5: false}

      data.system.talent.table = this._getTalentTable(table, gap, health, overflowX, overflowY);
    }

    super._preUpdate(data, options, userId);
  }

  _getTalentTable(table, gap, health, overflowX, overflowY) {
    let nodes = [];
    
    for (var i = 0; i < 6; ++i)
    for (var j = 0; j < 11; ++j) {
      if (table[i][j].state == true && table[i][j].stop == false && (health[i] == false || table[i][j].expert == true)) {
        nodes.push({x: i, y: j});
        table[i][j].num = "5";
      } else
        table[i][j].num = "12";
    }

    let dx = [0, 0, 1, -1];
    let dy = [1, -1, 0, 0];
    let move = [1, 1, 2, 2];
    for (var i = 0; i < nodes.length; ++i) {
      let queue = [nodes[i]];

      while (queue.length != 0) {
        let now = queue[0];
        queue.shift();
        
        if (+table[now.x][now.y].num == 12)
          continue;

        for (var d = 0; d < 4; ++d) {
          var nx = now.x + dx[d];
          var ny = now.y + dy[d];
          var m = move[d];

          if (overflowX && (nx < 0 || nx >= 6) )
            nx = (nx < 0) ? 5 : 0;
          if (overflowY && (ny < 0 || ny >= 11) )
            ny = (ny < 0) ? 10 : 0;
          
          if (nx < 0 || nx >= 6 || ny < 0 || ny >= 11)
            continue;

          let g = ( (now.x == 0 && nx == 5) || (now.x == 5 && nx == 0) ) ? gap[0] : gap[(nx > now.x) ? nx : now.x];
          if (m == 2 && g)
            m = 1;

          if (Number(table[nx][ny].num) > Number(table[now.x][now.y].num) + m) {
            table[nx][ny].num = String(Number(table[now.x][now.y].num) + m);
            queue.push({x: nx, y: ny});
          }
        }
      }
    }

    return table;
  }

  async rollTalent(title, num, add, secret) {
    if (!add) {
      this._onRollDice(title, num, null, null, null, secret); 
      return;
    }
    
    new Dialog({
        title: "Please put the additional value",
        content: `<label for='add'>${game.i18n.localize("Shinobigami.AddOn")}</label>
                  <p><input type='number' id='add'></p>
                  <label for='specialThreshhold'>${game.i18n.localize("Shinobigami.Special")}</label>
                  <p><input type='number' id='specialThreshhold' min='2' max='12'></p>
                  <label for='fumbleThreshhold'>${game.i18n.localize("Shinobigami.Fumble")}</label>
                  <p><input type='number' id='fumbleThreshhold' min='2' max='12'></p>
                  <script>$("#add").focus()</script>`,
        buttons: {
          confirm: {
            icon: '<i class="fas fa-check"></i>',
            label: "Confirm",
            callback: () => this._onRollDice(title, num, $("#add").val(), $("#specialThreshhold").val(), $("#fumbleThreshhold").val(), secret)
          }
        },
        default: "confirm"
    }).render(true);
    
  }

  async _onRollDice(title, num, add, specialThreshhold, fumbleThreshhold, secret) {
    
    // GM rolls.
    let chatData = {
        user: game.user.id,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        sound: CONFIG.sounds.dice,
        flavor: "<h2><b>" + title + "</b></h2>"
    };

    chatData.rollMode = (secret) ? "gmroll" : game.settings.get("core", "rollMode");
    if ( ["gmroll", "blindroll"].includes(chatData.rollMode) ) {
      chatData.whisper = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
    }
    else if ( chatData.rollMode === "selfroll" ) chatData.whisper = [game.user.id];
    else if ( chatData.rollMode === "publicroll" ) chatData.whisper = [];
    chatData.blind = chatData.rollMode === "blindroll";

    let formula = "2d6";
    if (add != null && Number.isInteger(parseInt(add)))
      formula += (add < 0) ? `${add}` : `+${add}`
    let roll = new Roll(formula);
    await roll.roll({async: true});
    let d = roll.terms[0].total;

    chatData.roll = roll;
    const hasSpecialThreshhold = Number.isInteger(parseInt(specialThreshhold));
    const hasFumbleThreshhold = Number.isInteger(parseInt(fumbleThreshhold));
    chatData.content = await renderTemplate("systems/shinobigami_ricky210/templates/roll.html", {
      formula: roll.formula,
      flavor: null,
      user: game.user.id,
      tooltip: await roll.getTooltip(),
      total: Math.round(roll.total * 100) / 100,
      special: d >= (hasSpecialThreshhold ? specialThreshhold : 12),
      fumble: d <= (hasFumbleThreshhold ? fumbleThreshhold : 2), 
      specialThreshhold: hasSpecialThreshhold ? `@${specialThreshhold}` : "",
      fumbleThreshhold: hasFumbleThreshhold ? `#${fumbleThreshhold}` : "",
      num: num
    });

    ChatMessage.create(chatData);

  }

}
