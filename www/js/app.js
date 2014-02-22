
hls.View = Backbone.View.extend({
    _render:function(){
         this.render(); //redraw HTML template
         $(this.el).trigger("create"); //trigger Jquery Mobile styling
    },
});

hls.HomeView = Backbone.View.extend({
    events: {
      'click button.login': '_login'
    },
    initialize:function(){
        this.model.bind('login', this._render, this);
        return this;
    },
    render:function (eventName) {
      if(hls.user.logged_in()){
        var template = _.template($('#user').html(),{user:hls.user});
        $(this.el).html(template);
        var carlistView = new hls.CarlistView({model: hls.user.cars });
        $('.carlist-holder', this.el).append(carlistView.render().el);
      } else {
        var template = _.template($('#home').html());
        $(this.el).html(template);
      }
      return this;
    },
    _render:function(){
        //force entire page to reload on login and logout
        this.remove();
        app.changePage(new hls.HomeView({model:hls.user})); 
    },
    _login:function(e){
        e.preventDefault();
        var session = new hls.UserSession();
        session.login();
        return;
    }
});

hls.CarlistView = hls.View.extend({
    initialize:function(){
        this.model.bind('loaded', this._render, this);
        return this;
    },
    render:function (eventName) {
      var template = _.template($('#carlist').html(),{cars:this.model});
      $(this.el).html(template);
      return this;
    },
});

hls.CarView = Backbone.View.extend({
    initialize:function(){
        return this;
    },    
    render:function (eventName) {
        var template = _.template($('#car').html(), {car:this.model})
        $(this.el).html(template);
        return this;
    }
});

hls.WelcomeView = hls.View.extend({
    events: {
      'click button.take-picture': '_takePicture'
    },
    initialize:function(){
        return this;
    },    
    render:function (eventName) {
        var template = _.template($('#welcome').html())
        $(this.el).html(template);
        return this;
    },
    _takePicture:function(){
        hls.camera.takePicture();
    }
});

hls.AppRouter = Backbone.Router.extend({
    routes:{
        "":"welcome",
        "login":"home",
        "cars/:id":"cars",

    },
    initialize:function () {
        // Handle back button throughout the application
        $('.back').live('click', function(event) {
            window.history.back();
            return false;
        });
        this.firstPage = true;
    },

    home:function () {
        console.log('#home');
        this.changePage(new hls.HomeView({model:hls.user}));
        
    },

    cars:function(id) {
        console.log('#cars');
        if(!hls.user.logged_in()){ this.home(); return; }
        var car = hls.user.cars.get(id);
        this.changePage(new hls.CarView({model:car}));
    },
    welcome:function () {
        console.log('#welcome');
        this.changePage(new hls.WelcomeView({model:hls.user.curr_car}));
        
    },
    changePage:function (page) {
        $(page.el).attr('data-role', 'page');
        page.render();
        $('body').append($(page.el));
        $.mobile.changePage($(page.el), {changeHash:false});
    }

});

$(document).ready(function () {
    console.log('document ready');
    app = new hls.AppRouter();
    Backbone.history.start();
});