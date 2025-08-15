/**
 * Extracts relevant content from page HTML for AI processing
 */
export class ContentExtractor {
  /**
   * Extract relevant content from page HTML
   */
  extractRelevantContent(html: string): string {
    if (!html) return 'No page content available';

    try {
      const cleanHtml = this.removeScriptsAndStyles(html);
      return this.extractFormElements(cleanHtml);
    } catch (error) {
      console.error('Error extracting page content:', error);
      return 'Error extracting page content';
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
      () => this.extractInputFields(html),
      () => this.extractTextareas(html),
      () => this.extractButtons(html),
      () => this.extractLabels(html),
      () => this.extractFieldsets(html)
    ];

    const content = extractors
      .map(extractor => extractor())
      .filter(content => content)
      .join('\n');

    return content || 'No form elements found';
  }

  /**
   * Extract input fields with their attributes
   */
  private extractInputFields(html: string): string {
    const inputMatches = html.match(/<input[^>]*>/gi) || [];
    return inputMatches.join('\n');
  }

  /**
   * Extract textarea fields
   */
  private extractTextareas(html: string): string {
    const textareaMatches = html.match(/<textarea[^>]*>.*?<\/textarea>/gi) || [];
    return textareaMatches.join('\n');
  }

  /**
   * Extract buttons
   */
  private extractButtons(html: string): string {
    const buttonMatches = html.match(/<button[^>]*>.*?<\/button>/gi) || [];
    return buttonMatches.join('\n');
  }

  /**
   * Extract form labels for context
   */
  private extractLabels(html: string): string {
    const labelMatches = html.match(/<label[^>]*>.*?<\/label>/gi) || [];
    return labelMatches.join('\n');
  }

  /**
   * Extract fieldsets for grouped form elements
   */
  private extractFieldsets(html: string): string {
    const fieldsetMatches = html.match(/<fieldset[^>]*>.*?<\/fieldset>/gis) || [];
    return fieldsetMatches
      .map(fieldset => {
        // Extract just the legend and structure, not the full content
        const legendMatch = fieldset.match(/<legend[^>]*>.*?<\/legend>/gi);
        return legendMatch ? legendMatch[0] : '';
      })
      .filter(legend => legend)
      .join('\n');
  }
}
