class Ripple {
  constructor(button) {
    this.button = button;

    this.rippleColor = JSON.parse(this.button.getAttribute("ripple-hsl"));

    if (this.rippleColor) {
      // https://stackoverflow.com/a/11371599/16557976  -- Thanks! 🙏

      this.customRippleCSS = `
        .ripple[ripple-hsl="[${this.rippleColor[0]}, ${this.rippleColor[1]}, ${this.rippleColor[2]}]"]:hover {
          background-color: hsla(${this.rippleColor[0]}, ${this.rippleColor[1]}%, ${this.rippleColor[2]}%,0.1) !important;
        }
        
        .ripple[ripple-hsl="[${this.rippleColor[0]}, ${this.rippleColor[1]}, ${this.rippleColor[2]}]"]:focus {
          box-shadow: 0 0 0 1pt hsla(${this.rippleColor[0]}, ${this.rippleColor[1]}%, ${this.rippleColor[2]}%, 0.35) !important;
        }
      `;

      this.style = document.createElement("style");

      if (this.style.styleSheet) {
        this.style.styleSheet.cssText = this.customRippleCSS;
      } else {
        this.style.appendChild(document.createTextNode(this.customRippleCSS));
      }

      document.getElementsByTagName("head")[0].appendChild(this.style);
    }

    this.rippleFadeDelay = 600;

    // desktop
    
    this.button.addEventListener("mousedown", (e) => {
      this.rippleEnter(e);
    });

    this.button.addEventListener("mouseup", (e) => {
      this.rippleLeave(e);
    });

    this.button.addEventListener("mouseleave", (e) => {
      this.rippleLeave(e);
    });
    
    // touch
    
    this.button.addEventListener("touchstart", (e) => {
      this.rippleEnter(e);
    });

    this.button.addEventListener("touchend", (e) => {
      this.rippleLeave(e);
    });

    this.button.addEventListener("touchleave", (e) => {
      this.rippleLeave(e);
    });
  }

  rippleEnter(e) {
    this.getRipplesNotLeave();

    this.clientX = e.clientX ? e.clientX : e.touches[0].clientX;
    this.clientY = e.clientY ? e.clientY : e.touches[0].clientY;

    this.dim = this.calcDim();
    this.circle = document.createElement("span");
    this.diameter = Math.max(this.button.clientWidth, this.button.clientHeight);
    this.radius = this.diameter / 2;

    this.x = `${this.clientX - this.dim.left - this.radius}px`;
    this.y = `${this.clientY - this.dim.top - this.radius}px`;
    this.centerX = `${this.dim.width / 2}px`;
    this.centerY = `${this.dim.height / 2}px`;

    if (this.clientX === 0 && this.clientY === 0) {
      this.x = `${this.centerX - this.radius}px`;
      this.y = `${this.centerY - this.radius}px`;
    }

    this.circle.style.width = this.circle.style.height = `${this.diameter}px`;
    this.circle.style.left = this.x;
    this.circle.style.top = this.y;
    this.circle.classList.add("_ripple--enter");

    if (this.rippleColor) {
      this.circle.style.backgroundColor = `hsla(${this.rippleColor[0]}, ${this.rippleColor[1]}%, ${this.rippleColor[2]}%, 0.3)`;
    }

    this.button.appendChild(this.circle);
  }

  rippleLeave(e) {
    this.getRipplesNotLeave();
    this.removeRipples();
  }

  getRipplesNotLeave() {
    let ripples = this.button.querySelectorAll(
      "._ripple--enter:not(._ripple--leave)"
    );
    ripples.forEach((ripple) => {
      ripple.classList.add("_ripple--leave");
    });
  }

  calcDim() {
    return this.button.getBoundingClientRect();
  }

  removeRipples() {
    let ripples = this.button.querySelectorAll("._ripple--leave");

    ripples.forEach((ripple) => {
      ripple.addEventListener("animationend", function () {
        ripple.remove();
      });
    });
  }
}

let buttons = document.querySelectorAll(".ripple");

buttons.forEach((button) => {
  new Ripple(button);
});
