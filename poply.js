Poply.elements = [];

function Poply(options = {}) { 
    this.opt = Object.assign({
        templateID: "", 
        closeMethods: ["button", "overlay", "escape"], 
        cssClass: [],
        destroyOnClose: true,
        footer: false,
        onOpen: () => {},
        onClose: () => {},
    }, options);

    this.allowButtonClose = this.opt.closeMethods.includes("button");
    this.allowBackdropClose = this.opt.closeMethods.includes("overlay");
    this.allowEscapeClose = this.opt.closeMethods.includes("escape");
    this.handleEscapeKey = this.handleEscapeKey.bind(this);

    this.templateContent = document.querySelector(`#${this.opt.templateID}`).content;
    this._footerButtons = [];
}

Poply.prototype._getScollbarWidth = function() {
    if (this.scrollbarWidth) {
        return this.scrollbarWidth;
    }

    const div = document.createElement("div");       
    document.body.append(div);

    Object.assign(div.style, {
        "position": "fixed",
        "left": "-9999px",
        "overflow": "scroll",
    });

    this.scrollbarWidth = div.offsetWidth - div.clientWidth; 
    return this.scrollbarWidth; 
}

Poply.prototype._build = function() {
    const content = this.templateContent.cloneNode(true);

    // modal backdrop
    this._modalBackdrop = document.createElement("div");
    this._modalBackdrop.classList = "poply__backdrop";

    // modal container
    const modalContainer = document.createElement("div");
    modalContainer.classList = "poply__container";

    // add option class for container
    if (this.opt.cssClass) {
        this.opt.cssClass.forEach(cssClass => {
            if (typeof cssClass === 'string') {
                modalContainer.classList.add(cssClass);
            }
        })
    }

    // modal close
    if (this.allowButtonClose) {            
        const modalClose = this.createButton("&times", "poply__close", () => this.close());
        modalContainer.append(modalClose);
    }

    // modal content
    const modalContent = document.createElement("div");
    modalContent.classList = "poply__content";
    modalContent.append(content);
    modalContainer.append(modalContent);

    // add option footer
    if (this.opt.footer) {
        if (!this._modalFooter) {
            this._modalFooter = document.createElement("div");
            this._modalFooter.classList = "poply__footer";
            modalContainer.append(this._modalFooter);
        }
        
        this.renderFooterContent();
        this.renderFooterButton();
    }

    // append node        
    this._modalBackdrop.append(modalContainer);
    document.body.append(this._modalBackdrop);
}

Poply.prototype.addFooterButton = function(title, cssClass, callback) {
    const button = this.createButton(title, cssClass, callback);
    this._footerButtons.push(button);

    this.renderFooterButton();
}

Poply.prototype.renderFooterButton = function() {
    if (this._modalFooter && this._footerButtons) {
        this._footerButtons.forEach(button => {
            this._modalFooter.append(button);
        })
    }
}

Poply.prototype.createButton = function(title, cssClass, callback) {
    const button = document.createElement("button");
    button.classList = cssClass;
    button.innerHTML = title;
    button.onclick = callback;

    return button;
}

Poply.prototype.renderFooterContent = function() {
    if (this._modalFooter && this._footerContent) {
        this._modalFooter.innerHTML = this._footerContent;
    }    
}

Poply.prototype.setFooterContent = function(content) {
    this._footerContent = content;
    this.renderFooterContent();     
}

Poply.prototype.open = function() {        
    Poply.elements.push(this);

    if (!this._modalBackdrop) {
        this._build();
    }

    if (this._modalBackdrop) {
        setTimeout(() => {
            this._modalBackdrop.classList.add("poply--show");
        }, 0);
    }

    // modal backdrop click
    if (this.allowBackdropClose) {
        this._modalBackdrop.onclick = (e) => {
            if (e.target === this._modalBackdrop) {
                this.close();
            }
        }
    }

    // escape key close
    if (this.allowEscapeClose) {
        document.addEventListener("keydown", this.handleEscapeKey);
    }

    document.body.classList.add("poply--no-scroll");
    document.body.style.paddingRight = this._getScollbarWidth() + "px";

    this._onTransitionEnd(this.opt.onOpen);

    return this._modalBackdrop;
},

Poply.prototype.handleEscapeKey = function(e) {
    const lastModal = Poply.elements[Poply.elements.length - 1];
    if (e.key === "Escape" && this === lastModal) {
        this.close();
    }
}

Poply.prototype._onTransitionEnd = function(callback) {
    this._modalBackdrop.ontransitionend = (e) => {
        if (e.propertyName !== "transform") return;       
        if (typeof callback === 'function') callback();
    }
}

Poply.prototype.close = function(destroy = this.opt.destroyOnClose) {   
    Poply.elements.pop(); 
    // escape key close
    if (this.allowEscapeClose) {
        document.removeEventListener("keydown", this.handleEscapeKey);
    }

    this._modalBackdrop.classList.remove("poply--show");
    
    if (destroy) {
        this._onTransitionEnd(() => {
            this._modalBackdrop.remove();
            this._modalBackdrop = null;
            this._modalFooter = null;

            if (!Poply.elements.length) {
                document.body.classList.remove("poply--no-scroll");
                document.body.style.paddingRight = "";
            }
    
            if (typeof onClose === 'function') this.opt.onClose();
        });
    }
}, 

Poply.prototype.destroy = function() {
    this.close(true);
}
