'use babel';

export default class SmartMoveView {

  constructor(serializedState, onAccept) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('smart-move');
    this.element.classList.add('tree-view-dialog');

    let label = document.createElement('label')
    label.textContent = 'Enter the new path for the file';
    this.element.appendChild(label);

    this.editor = document.createElement('atom-text-editor')
    this.editor.setAttribute('mini', true)

    this.editor.addEventListener('keyup', (event)=>{
        if (event.key==='Enter'){
            onAccept();
        }
    })

    this.element.appendChild(this.editor)

  }

  getTextEditor(){
      return this.editor.getModel();
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
