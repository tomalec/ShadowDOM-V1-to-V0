/**
 * Set of utilities to transform Shadow DOM v1 to v0.
 * Usefull when writing "hybrid" Web Components which are V1 redy,
 * but run in v0 environment/polyfill
 * @license MIT
 */
const TranslateShadowDOM = {
    /**
     * Utils to translate from V1 to V0
     */
    v1tov0: {
        /**
        * Replaces all <slot> tags with <content>,
        *  preserves all attributes, translates selector to slot name
        * @param  {String} string stringified HTML
        * @return {String}        translated HTML
        */
        html: function(string){
            return string.replace(/<\/slot(\s*)>/gi,'</content$1>')
                        .replace(/<slot([^>]+)(name=(?:"([^"]*)"|'([^']*)'))([^>]*)>/gi,'<content$1$2$5 select=\"[slot=\'$3$4\']\">')
                        .replace(/<slot(\s*|\s+[^>]*)>/gi,'<content$1>');
        },
        /**
        * Replaces single SlotElement with ContentElement,
        *  preserves all attributes, translates name to selector
        * @param  {SlotElement} slot
        * @return {ContentElement}
        */
        slot: function(slot) {
            var content = slot.ownerDocument.createElement('content');
            while (slot.firstChild) {
                content.appendChild(slot.firstChild);
            }
            var attrs = slot.attributes;
            for (var i=0; i<attrs.length; i++) {
                var attr = attrs[i];
                content.setAttribute(attr.name, attr.value);
            }
            var name = slot.getAttribute('name');
            if (name) {
                content.setAttribute('select', '[slot=\'' + name + '\']');
            }
            slot.parentNode.replaceChild(content, slot);
            return content;
        },
        /**
        * Replace all <slot> elements with <content> elements i given document fragment
        * @param  {Documentfragment|Node} root scope. Will be changed.
        * @param  {Boolean}                 withStyle should enclosed `style` tags be also translated
        * @return {Documentfragment|Node}      modified scope
        */
        fragment: function(root, withStyle) {
            if (root.firstChild) {
                var node = root.firstChild;
                while (node) {
                    var next = node.nextSibling;
                    if (node.localName === 'slot') {
                        node = TranslateShadowDOM.v1tov0.slot(node);
                    } else if (withStyle && node.localName === 'style') {
                        node.textContent = TranslateShadowDOM.v1tov0.css(node.textContent);
                    }
                    node = next;
                }
            }
            return root;
        },
        /**
        * Replaces all ::slotted() tags with ::content
        * @param  {String} string stringified CSS
        * @return {String}        translated CSS
        */
        css: function(string) {
            return string.replace(/::slotted\(([^\)]*)\)/gi,'::content $1');
        }
    },
    /**
     * Utils to translate from V0 to V1
     */
    v0tov1: {
        /**
        * Replaces all <content> tags with <slot>,
        *  preserves all attributes **except** name, translates selector to slot name
        * @param  {String} string stringified HTML
        * @return {String}        translated HTML
        */
        html: function(string){
            return string.replace(/<\/content(\s*)>/gi,'</slot$1>')
                        .replace(/<content([^>]*?)(\s+name=(?:"([^"]*)"|'([^']*)'))([^>]*)>/gi,'<content$1$5>')
                        .replace(/<content([^>]+)(select="\s*\[slot=(?:"([^"]*)"|'([^']*)')\]\s*")([^>]*)>/gi,'<slot$1$2$5 name=\"$3$4\">')
                        .replace(/<content(\s*|\s+[^>]*)>/gi,'<slot$1>');
        },
        /**
        * Replaces single ContentElement with SlotElement,
        *  preserves all attributes, translates selector to slot name.
        *  If selector cannot be directly translated to slot name, default slot would be created.
        * @param  {ContentElement} content
        * @return {SlotElement}
        */
        content: function(content) {
            var slot = content.ownerDocument.createElement('slot');
            while (content.firstChild) {
                slot.appendChild(content.firstChild);
            }
            var attrs = content.attributes;
            for (var i=0; i<attrs.length; i++) {
                var attr = attrs[i];
                if(attr.name !== 'name'){
                    slot.setAttribute(attr.name, attr.value);
                }
            }
            var name = content.getAttribute('select');
            var match;
            if (name && (match = name.match(/\s*\[slot=(?:"([^"]*)"|'([^']*)')\]\s*/i))) {
                slot.setAttribute('name', match[1] || match[2]);
            }
            content.parentNode.replaceChild(slot, content);
            return slot;
        },
        /**
        * Replace all <slot> elements with <content> elements i given document fragment.
        * @param  {Documentfragment|Node} root scope. Will be changed.
        * @param  {Boolean}                 withStyle should enclosed `style` tags be also translated
        * @return {Documentfragment|Node}      modified scope
        */
        fragment: function(root, withStyle) {
            if (root.firstChild) {
                var node = root.firstChild;
                while (node) {
                    var next = node.nextSibling;
                    if (node.localName === 'content') {
                        node = TranslateShadowDOM.v0tov1.content(node);
                    } else if (withStyle && node.localName === 'style') {
                        node.textContent = TranslateShadowDOM.v0tov1.css(node.textContent);
                    }
                    node = next;
                }
            }
            return root;
        },
        /**
        * Replaces all ::slotted() tags with ::content
        * @param  {String} string stringified CSS
        * @return {String}        translated CSS
        */
        css: function(string) {
            return string.replace(/::content\s*([^,{]*?)(\s*[,{])/gi,'::slotted($1)$2');
        }
    }
}

if (typeof module !== 'undefined') {
  module.exports = TranslateShadowDOM;
  // export default TranslateShadowDOM;
}