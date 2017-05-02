console.log("js");

window.Event = new class{
    constructor(){
        this.vue = new Vue();
    }

    fire(event, data=null){
        this.vue.$emit(event, data);
    }

    listen(event, callback){
        this.vue.$on(event, callback);
    }
}

window.DataStore = new class{
    saveList(list, data){
        console.log(list);
        console.log(JSON.stringify(data));
        localStorage.setItem(list, JSON.stringify(data));
    }

    getList(list){
        return JSON.parse(localStorage.getItem(list));
    }

}

class LogEntry{
    constructor(type, value, isPriority = false, date = null, done = false){
        this.type = type;
        this.value = value;
        this.isPriority = isPriority;
        this.date = date; 
        this.done = done;
        this.icon = getIcon(type);
    }
}

// util functions

function getIcon(logEntryType){
    if(logEntryType == 'task'){
        return 'fa-circle';
    }

    if(logEntryType == 'note'){
        return 'fa-minus';
    }

    if(logEntryType == 'event'){
        return 'fa-circle-thin'
    }
}

// end util functions

new Vue({
  el: '#logentry',
  data: {
    icon: 'fa-circle',
    type: 'task',
    logged: '',
    priority: false,
  },

  methods: {

    _getFirst(){
      return this.logged.charAt(0)
    },

    _setAsTask(){
        this.type = 'task';
        this.icon = getIcon(this.type);
    },

    _setAsNote(){
        this.type = 'note';
        this.icon = getIcon(this.type);
    },

    _setAsEvent(){
        this.type = 'event';
        this.icon = getIcon(this.type);
    },

    _setPriority(priority=true){
        this.priority = priority;
    },

    _setType(input){
        first = input.charAt(0);

        if(first == '.'){
            // task
            this._setAsTask();
        }

        else if(first == '-'){
            // note
            this._setAsNote();
        }

        else if(first == 'o'){
            // event
            this._setAsEvent();
        }

        else{
            this._setAsTask();
        }
    },

    updateIcon(){
      if(this.logged.length < 1){
        this._setPriority(false);
        this._setAsTask();
        return;
      }
      
      first = this._getFirst();

      if(first == '*'){
          // priority
          this._setPriority();
          this._setType(this.logged.substr(1));
      }else{
          this._setType(this.logged);
      }
    },

    add(){
        if(this.logged.length < 1)
            return;

        Event.fire("new-task", {
            "type" : this.type,
            "value" : this.logged,
            "icon" : this.icon,
            "priority" : this.priority
        });

        this.logged = ''
        this._setAsTask();
    }
  }
})

new Vue({
    el: "#loglist",

    mounted(){
        Event.listen("new-task", (data) => this.add(data));
        this.logged = DataStore.getList('mainList');
    },

    data: {
        logged: []
    },

    computed: {
        sortedLogs(){
            // Sort priority to the top
            loggedWithIndices = this.logged;
            for(i=0; i<loggedWithIndices.length; i++){
                loggedWithIndices[i]['unsortedIndex'] = i;
            }

            return _.sortBy(loggedWithIndices, (log) => log.isPriority? 0 : 1);
        }
    },

    methods: {
        add(data){
            if(data.value.length < 1)
                return;

            value = data.value;
            first = value.charAt(0);

            if(first == '.' || first == 'o' || first == '-'){
                value = value.slice(1);
            }

            value = value.trim();

            if(value.length < 1)
                return;

            data.value = value;

            this.logged.push(new LogEntry(data.type, data.value, data.priority));

            DataStore.saveList('mainList', this.logged);
        },

        toggleDone(row){
            row.done = !row.done;
            DataStore.saveList('mainList', this.logged);
        },

        togglePriority(row){
            row.isPriority = !row.isPriority;
            DataStore.saveList('mainList', this.logged);
        },

        deleteTask(row){
            this.logged.splice(row.unsortedIndex, 1);
            DataStore.saveList('mainList', this.logged);
        }
    }

})