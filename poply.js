Poply.elements = [];

function Poply(options = {}) {   
    this.opt = Object.assign({
        closeMethods: ["button", "overlay", "escape"], 
        cssClass: [],
        destroyOnClose: true,
        footer: false,
        onOpen: () => {},
        onClose: () => {},
        enableScrollLock: true,
        scrollLockTarget: () => document.body,
    }, options);

    if (!options.content && !options.templateId) {
        console.error("You must provide one of 'content' or 'templateId'.");
        return;
    }

    if (options.content && options.templateId) {
        options.templateId = null;
        console.warn(
            "Both 'content' and 'templateId' are specified. 'content' will take precedence, and 'templateId' will be ignored."
        );
    }

    if (options.templateId) {
        this.template = document.querySelector(`#${options.templateId}`);

        if (!this.template) {
            console.error(`#${options.templateId} does not exist!`);
            return;
        }
    }

    this.templateId = this.opt.templateId;
    this.content = this.opt.content;
    this.allowButtonClose = this.opt.closeMethods.includes("button");
    this.allowBackdropClose = this.opt.closeMethods.includes("overlay");
    this.allowEscapeClose = this.opt.closeMethods.includes("escape");
    this.handleEscapeKey = this.handleEscapeKey.bind(this);
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
    const contentNode = this.content ? document.createElement("div") : (this.templateId ? this.template.content.cloneNode(true) : "");  

    if (this.content) {
        contentNode.innerHTML = this.content;
    }

    // modal backdrop
    this._modalBackdrop = document.createElement("div");
    this._modalBackdrop.classList = "poply";

    // modal container
    const modalContainer = document.createElement("div");
    modalContainer.classList = "poply__container";    

    if (Array.isArray(this.opt.cssClass)) { 
        this.opt.cssClass.forEach(cssClass => {
            if (typeof cssClass === 'string') {
                modalContainer.classList.add(cssClass);
            }
        });
    } else {
        console.error("cssClass is not an array:", this.opt.cssClass);
    }


    // modal close
    if (this.allowButtonClose) {            
        const modalClose = this.createButton("&times", "poply__close", () => this.close());
        modalContainer.append(modalClose);
    }

    // modal content
    this.modalContent = document.createElement("div");
    this.modalContent.classList = "poply__content";
    this.modalContent.append(contentNode);
    modalContainer.append(this.modalContent);

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

Poply.prototype.setContent = function(content) {
    this.content = content;
    if (this.modalContent) {
        this.modalContent.innerHTML = this.content;
    }
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

Poply.prototype._hasScrollbar = function(target) {
    if ([document.documentElement, document.body].includes(target)) {
        return document.documentElement.scrollHeight > document.documentElement.clientHeight || 
                document.body.scrollHeight > document.body.clientHeight;
    }
    return target.scrollHeight > target.clientHeight;
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

    if (Poply.elements.length === 1 && this.opt.enableScrollLock) {
        const target = this.opt.scrollLockTarget();     

        if (this._hasScrollbar(target)) { 
            target.classList.add("poply--no-scroll");
            
            const targetPaddingRight = parseInt(getComputedStyle(target).paddingRight);
            target.style.paddingRight = targetPaddingRight + this._getScollbarWidth() + "px";
        }
    }

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

            if (this.opt.enableScrollLock && !Poply.elements.length) {      
                const target = this.opt.scrollLockTarget();

                if (this._hasScrollbar(target)) {
                    target.classList.remove("poply--no-scroll");
                    target.style.paddingRight = "";
                }
            }
    
            if (typeof onClose === 'function') this.opt.onClose();
        });
    }
}, 

Poply.prototype.destroy = function() {
    this.close(true);
}
