/**
 * Extracts relevant content from page HTML for AI processing
 */

interface FormField {
  type: string;
  name?: string;
  id?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
}

interface SelectElement {
  name?: string;
  id?: string;
  multiple?: boolean;
  required?: boolean;
  options: Array<{
    value?: string;
    text: string;
    selected?: boolean;
  }>;
}

interface InteractableElement {
  tagName: string;
  type?: string;
  href?: string;
  text?: string;
  id?: string;
  className?: string;
  attributes?: Record<string, string>;
}

export class ContentExtractor {
  /**
   * Extract relevant content from page HTML
   */
  extractRelevantContent(html: string): string {
    if (!html) return 'No page content available';

    try {
      const cleanHtml = this.removeScriptsAndStyles(html);
      const formContent = this.extractFormElements(cleanHtml);
      const interactableContent = this.extractInteractableElements(cleanHtml);

      return [formContent, interactableContent]
        .filter(content => content && content !== 'No form elements found' && content !== 'No interactable elements found')
        .join('\n\n=== INTERACTABLE ELEMENTS ===\n');
    } catch (error) {
      console.error('Error extracting page content:', error);
      return 'Error extracting page content';
    }
  }

  /**
   * Extract structured data for form fields and interactable elements
   */
  extractStructuredContent(html: string): {
    formFields: FormField[];
    selectElements: SelectElement[];
    interactableElements: InteractableElement[];
  } {
    if (!html) {
      return {
        formFields: [],
        selectElements: [],
        interactableElements: []
      };
    }

    try {
      const cleanHtml = this.removeScriptsAndStyles(html);
      return {
        formFields: this.extractFormFieldsStructured(cleanHtml),
        selectElements: this.extractSelectElementsStructured(cleanHtml),
        interactableElements: this.extractInteractableElementsStructured(cleanHtml)
      };
    } catch (error) {
      console.error('Error extracting structured content:', error);
      return {
        formFields: [],
        selectElements: [],
        interactableElements: []
      };
    }
  }

  /**
   * Remove script and style tags from HTML
   */
  private removeScriptsAndStyles(html: string): string {
    let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    return cleanHtml;
  }

  /**
   * Extract form-related elements from HTML
   */
  private extractFormElements(html: string): string {
    const extractors = [
      () => this.extractFormFields(html),
      () => this.extractSelectElements(html),
      () => this.extractFormStructure(html)
    ];

    const content = extractors
      .map(extractor => extractor())
      .filter(content => content)
      .join('\n');

    return content || 'No form elements found';
  }

  /**
   * Extract comprehensive form field information
   */
  private extractFormFields(html: string): string {
    const fields: string[] = [];

    // Extract input fields with detailed attributes
    const inputMatches = html.match(/<input[^>]*>/gi) || [];
    inputMatches.forEach(input => {
      const type = this.extractAttribute(input, 'type') || 'text';
      const name = this.extractAttribute(input, 'name');
      const id = this.extractAttribute(input, 'id');
      const placeholder = this.extractAttribute(input, 'placeholder');
      const value = this.extractAttribute(input, 'value');
      const required = input.includes('required');

      let fieldInfo = `INPUT[type="${type}"`;
      if (name) fieldInfo += `, name="${name}"`;
      if (id) fieldInfo += `, id="${id}"`;
      if (placeholder) fieldInfo += `, placeholder="${placeholder}"`;
      if (value) fieldInfo += `, value="${value}"`;
      if (required) fieldInfo += `, required`;
      fieldInfo += ']';

      fields.push(fieldInfo);
    });

    // Extract textarea fields
    const textareaMatches = html.match(/<textarea[^>]*>.*?<\/textarea>/gi) || [];
    textareaMatches.forEach(textarea => {
      const name = this.extractAttribute(textarea, 'name');
      const id = this.extractAttribute(textarea, 'id');
      const placeholder = this.extractAttribute(textarea, 'placeholder');
      const required = textarea.includes('required');

      let fieldInfo = `TEXTAREA`;
      if (name) fieldInfo += `[name="${name}"`;
      if (id) fieldInfo += `, id="${id}"`;
      if (placeholder) fieldInfo += `, placeholder="${placeholder}"`;
      if (required) fieldInfo += `, required`;
      fieldInfo += ']';

      fields.push(fieldInfo);
    });

    return fields.join('\n');
  }

  /**
   * Extract select elements and their options
   */
  private extractSelectElements(html: string): string {
    const selects: string[] = [];
    const selectMatches = html.match(/<select[^>]*>.*?<\/select>/gis) || [];

    selectMatches.forEach(select => {
      const name = this.extractAttribute(select, 'name');
      const id = this.extractAttribute(select, 'id');
      const multiple = select.includes('multiple');
      const required = select.includes('required');

      let selectInfo = `SELECT`;
      if (name) selectInfo += `[name="${name}"`;
      if (id) selectInfo += `, id="${id}"`;
      if (multiple) selectInfo += `, multiple`;
      if (required) selectInfo += `, required`;
      selectInfo += ']';

      // Extract options
      const optionMatches = select.match(/<option[^>]*>.*?<\/option>/gi) || [];
      const options = optionMatches.map(option => {
        const value = this.extractAttribute(option, 'value');
        const selected = option.includes('selected');
        const text = option.replace(/<[^>]*>/g, '').trim();

        let optionInfo = `  OPTION[`;
        if (value) optionInfo += `value="${value}"`;
        if (selected) optionInfo += `, selected`;
        optionInfo += `]: "${text}"`;

        return optionInfo;
      });

      selects.push(selectInfo + '\n' + options.join('\n'));
    });

    return selects.join('\n');
  }

  /**
   * Extract form structure and labels
   */
  private extractFormStructure(html: string): string {
    const structure: string[] = [];

    // Extract forms with their action and method
    const formMatches = html.match(/<form[^>]*>/gi) || [];
    formMatches.forEach(form => {
      const action = this.extractAttribute(form, 'action');
      const method = this.extractAttribute(form, 'method') || 'GET';
      const id = this.extractAttribute(form, 'id');

      let formInfo = `FORM[method="${method}"`;
      if (action) formInfo += `, action="${action}"`;
      if (id) formInfo += `, id="${id}"`;
      formInfo += ']';

      structure.push(formInfo);
    });

    // Extract labels with their associations
    const labelMatches = html.match(/<label[^>]*>.*?<\/label>/gi) || [];
    labelMatches.forEach(label => {
      const forAttr = this.extractAttribute(label, 'for');
      const text = label.replace(/<[^>]*>/g, '').trim();

      let labelInfo = `LABEL`;
      if (forAttr) labelInfo += `[for="${forAttr}"]`;
      labelInfo += `: "${text}"`;

      structure.push(labelInfo);
    });

    // Extract fieldsets
    const fieldsetMatches = html.match(/<fieldset[^>]*>.*?<\/fieldset>/gis) || [];
    fieldsetMatches.forEach(fieldset => {
      const legendMatch = fieldset.match(/<legend[^>]*>(.*?)<\/legend>/i);
      const legend = legendMatch ? legendMatch[1].trim() : '';

      let fieldsetInfo = `FIELDSET`;
      if (legend) fieldsetInfo += `[legend="${legend}"]`;

      structure.push(fieldsetInfo);
    });

    return structure.join('\n');
  }

  /**
   * Extract interactable elements for selection
   */
  private extractInteractableElements(html: string): string {
    const interactables: string[] = [];

    // Extract clickable elements
    const clickableSelectors = [
      'a[href]',
      'button',
      '[onclick]',
      '[role="button"]',
      '[tabindex]',
      'input[type="submit"]',
      'input[type="button"]',
      'input[type="reset"]'
    ];

    clickableSelectors.forEach(selector => {
      const regex = this.createElementRegex(selector);
      const matches = html.match(regex) || [];

      matches.forEach(element => {
        const elementInfo = this.extractElementInfo(element, selector);
        if (elementInfo) interactables.push(elementInfo);
      });
    });

    // Extract other interactable elements
    this.extractCheckboxesAndRadios(html, interactables);
    this.extractEditableElements(html, interactables);

    return interactables.length > 0 ? interactables.join('\n') : 'No interactable elements found';
  }

  /**
   * Extract checkboxes and radio buttons
   */
  private extractCheckboxesAndRadios(html: string, interactables: string[]): void {
    const inputMatches = html.match(/<input[^>]*type=["']?(checkbox|radio)["']?[^>]*>/gi) || [];

    inputMatches.forEach(input => {
      const type = this.extractAttribute(input, 'type');
      const name = this.extractAttribute(input, 'name');
      const value = this.extractAttribute(input, 'value');
      const id = this.extractAttribute(input, 'id');
      const checked = input.includes('checked');

      let elementInfo = `${type?.toUpperCase()}`;
      if (name) elementInfo += `[name="${name}"`;
      if (value) elementInfo += `, value="${value}"`;
      if (id) elementInfo += `, id="${id}"`;
      if (checked) elementInfo += `, checked`;
      elementInfo += ']';

      interactables.push(elementInfo);
    });
  }

  /**
   * Extract editable elements
   */
  private extractEditableElements(html: string, interactables: string[]): void {
    const editableMatches = html.match(/<[^>]*contenteditable=["']?true["']?[^>]*>.*?<\/[^>]*>/gi) || [];

    editableMatches.forEach(element => {
      const tagName = element.match(/<(\w+)/)?.[1]?.toUpperCase();
      const id = this.extractAttribute(element, 'id');
      const className = this.extractAttribute(element, 'class');

      let elementInfo = `${tagName}[contenteditable]`;
      if (id) elementInfo += `[id="${id}"]`;
      if (className) elementInfo += `[class="${className}"]`;

      interactables.push(elementInfo);
    });
  }

  /**
   * Create regex for element matching
   */
  private createElementRegex(selector: string): RegExp {
    // Simplified regex creation for basic selectors
    if (selector === 'a[href]') {
      return /<a[^>]*href[^>]*>.*?<\/a>/gi;
    }
    if (selector === 'button') {
      return /<button[^>]*>.*?<\/button>/gi;
    }
    if (selector === '[onclick]') {
      return /<[^>]*onclick[^>]*>/gi;
    }
    if (selector === '[role="button"]') {
      return /<[^>]*role=["']?button["']?[^>]*>/gi;
    }
    if (selector === '[tabindex]') {
      return /<[^>]*tabindex[^>]*>/gi;
    }
    return new RegExp(`<${selector}[^>]*>`, 'gi');
  }

  /**
   * Extract element information
   */
  private extractElementInfo(element: string, selector: string): string | null {
    const tagName = element.match(/<(\w+)/)?.[1]?.toUpperCase();
    if (!tagName) return null;

    let info = tagName;

    // Add relevant attributes based on element type
    if (selector === 'a[href]') {
      const href = this.extractAttribute(element, 'href');
      const text = element.replace(/<[^>]*>/g, '').trim();
      info += `[href="${href}"]: "${text}"`;
    } else if (selector === 'button') {
      const type = this.extractAttribute(element, 'type') || 'button';
      const text = element.replace(/<[^>]*>/g, '').trim();
      info += `[type="${type}"]: "${text}"`;
    } else {
      const id = this.extractAttribute(element, 'id');
      const className = this.extractAttribute(element, 'class');

      if (id) info += `[id="${id}"]`;
      if (className) info += `[class="${className}"]`;
    }

    return info;
  }

  /**
   * Extract attribute value from HTML element
   */
  private extractAttribute(element: string, attribute: string): string | null {
    const regex = new RegExp(`${attribute}=["']([^"']*)["']`, 'i');
    const match = element.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Extract form fields as structured data
   */
  private extractFormFieldsStructured(html: string): FormField[] {
    const fields: FormField[] = [];

    // Extract input fields
    const inputMatches = html.match(/<input[^>]*>/gi) || [];
    inputMatches.forEach(input => {
      const field: FormField = {
        type: this.extractAttribute(input, 'type') || 'text',
        name: this.extractAttribute(input, 'name') || undefined,
        id: this.extractAttribute(input, 'id') || undefined,
        placeholder: this.extractAttribute(input, 'placeholder') || undefined,
        value: this.extractAttribute(input, 'value') || undefined,
        required: input.includes('required') || undefined
      };

      // Remove undefined properties
      Object.keys(field).forEach(key => {
        if (field[key as keyof FormField] === undefined) {
          delete field[key as keyof FormField];
        }
      });

      fields.push(field);
    });

    // Extract textarea fields
    const textareaMatches = html.match(/<textarea[^>]*>.*?<\/textarea>/gi) || [];
    textareaMatches.forEach(textarea => {
      const field: FormField = {
        type: 'textarea',
        name: this.extractAttribute(textarea, 'name') || undefined,
        id: this.extractAttribute(textarea, 'id') || undefined,
        placeholder: this.extractAttribute(textarea, 'placeholder') || undefined,
        required: textarea.includes('required') || undefined
      };

      // Remove undefined properties
      Object.keys(field).forEach(key => {
        if (field[key as keyof FormField] === undefined) {
          delete field[key as keyof FormField];
        }
      });

      fields.push(field);
    });

    return fields;
  }

  /**
   * Extract select elements as structured data
   */
  private extractSelectElementsStructured(html: string): SelectElement[] {
    const selects: SelectElement[] = [];
    const selectMatches = html.match(/<select[^>]*>.*?<\/select>/gis) || [];

    selectMatches.forEach(select => {
      const selectElement: SelectElement = {
        name: this.extractAttribute(select, 'name') || undefined,
        id: this.extractAttribute(select, 'id') || undefined,
        multiple: select.includes('multiple') || undefined,
        required: select.includes('required') || undefined,
        options: []
      };

      // Extract options
      const optionMatches = select.match(/<option[^>]*>.*?<\/option>/gi) || [];
      selectElement.options = optionMatches.map(option => {
        return {
          value: this.extractAttribute(option, 'value') || undefined,
          text: option.replace(/<[^>]*>/g, '').trim(),
          selected: option.includes('selected') || undefined
        };
      }).map(option => {
        // Remove undefined properties
        Object.keys(option).forEach(key => {
          if (option[key as keyof typeof option] === undefined) {
            delete option[key as keyof typeof option];
          }
        });
        return option;
      });

      // Remove undefined properties
      Object.keys(selectElement).forEach(key => {
        if (selectElement[key as keyof SelectElement] === undefined) {
          delete selectElement[key as keyof SelectElement];
        }
      });

      selects.push(selectElement);
    });

    return selects;
  }

  /**
   * Extract interactable elements as structured data
   */
  private extractInteractableElementsStructured(html: string): InteractableElement[] {
    const interactables: InteractableElement[] = [];
    const priorityInteractables: InteractableElement[] = [];

    // Extract links
    const linkMatches = html.match(/<a[^>]*href[^>]*>.*?<\/a>/gi) || [];
    linkMatches.forEach(link => {
      const linkElement = {
        tagName: 'A',
        href: this.extractAttribute(link, 'href') || undefined,
        text: link.replace(/<[^>]*>/g, '').trim(),
        id: this.extractAttribute(link, 'id') || undefined,
        className: this.extractAttribute(link, 'class') || undefined
      };
      
      // Check if this is an "add" related link - prioritize it
      const text = linkElement.text?.toLowerCase() || '';
      if (text.includes('add') || text.includes('ajouter') || text.includes('create') || text.includes('new') || text.includes('créer')) {
        priorityInteractables.push(linkElement);
      } else {
        interactables.push(linkElement);
      }
    });

    // Extract buttons
    const buttonMatches = html.match(/<button[^>]*>.*?<\/button>/gi) || [];
    buttonMatches.forEach(button => {
      const buttonElement = {
        tagName: 'BUTTON',
        type: this.extractAttribute(button, 'type') || 'button',
        text: button.replace(/<[^>]*>/g, '').trim(),
        id: this.extractAttribute(button, 'id') || undefined,
        className: this.extractAttribute(button, 'class') || undefined
      };
      
      // Check if this is an "add" related button - prioritize it
      const text = buttonElement.text?.toLowerCase() || '';
      const className = buttonElement.className?.toLowerCase() || '';
      if (text.includes('add') || text.includes('ajouter') || text.includes('create') || text.includes('new') || text.includes('créer') ||
          className.includes('add') || className.includes('create')) {
        priorityInteractables.push(buttonElement);
      } else {
        interactables.push(buttonElement);
      }
    });

    // Extract input buttons
    const inputButtonMatches = html.match(/<input[^>]*type=["']?(submit|button|reset)["']?[^>]*>/gi) || [];
    inputButtonMatches.forEach(input => {
      const inputElement = {
        tagName: 'INPUT',
        type: this.extractAttribute(input, 'type') || undefined,
        text: this.extractAttribute(input, 'value') || '',
        id: this.extractAttribute(input, 'id') || undefined,
        className: this.extractAttribute(input, 'class') || undefined
      };
      
      // Check if this is an "add" related input button - prioritize it
      const text = inputElement.text?.toLowerCase() || '';
      const className = inputElement.className?.toLowerCase() || '';
      if (text.includes('add') || text.includes('ajouter') || text.includes('create') || text.includes('new') || text.includes('créer') ||
          className.includes('add') || className.includes('create')) {
        priorityInteractables.push(inputElement);
      } else {
        interactables.push(inputElement);
      }
    });

    // Extract checkboxes and radio buttons
    const checkboxRadioMatches = html.match(/<input[^>]*type=["']?(checkbox|radio)["']?[^>]*>/gi) || [];
    checkboxRadioMatches.forEach(input => {
      interactables.push({
        tagName: 'INPUT',
        type: this.extractAttribute(input, 'type') || undefined,
        id: this.extractAttribute(input, 'id') || undefined,
        className: this.extractAttribute(input, 'class') || undefined,
        attributes: {
          name: this.extractAttribute(input, 'name') || '',
          value: this.extractAttribute(input, 'value') || '',
          checked: input.includes('checked') ? 'true' : 'false'
        }
      });
    });

    // Combine priority elements first, then regular elements
    const allInteractables = [...priorityInteractables, ...interactables];

    // Clean up undefined properties
    return allInteractables.map(element => {
      Object.keys(element).forEach(key => {
        if (element[key as keyof InteractableElement] === undefined) {
          delete element[key as keyof InteractableElement];
        }
      });
      return element;
    });
  }
}
