//structure of data entries
interface SearchEntry {
  id: string | number;
  title: string;
  content: string;
}

interface SearchEventPayload {
  search_type: 'full_text';
  query: string;
}

class SearchBarController {
  private fullList: SearchEntry[];
  private currentList: SearchEntry[];
  
  constructor(initialEntries: SearchEntry[]) {
    this.fullList = initialEntries;
    this.currentList = [...initialEntries];
  }

  
  public handleSearchInput(query: string): SearchEntry[] {
    const trimmedQuery = query.trim();

    //clear list if no query
    if (!trimmedQuery) {
      this.currentList = [...this.fullList];
      return this.currentList;
    }

    //convert to lower case for case-insensitivity
    const lowerCaseQuery = trimmedQuery.toLowerCase();
    
    this.currentList = this.fullList.filter(entry => 
      entry.content.toLowerCase().includes(lowerCaseQuery) || 
      entry.title.toLowerCase().includes(lowerCaseQuery)
    );

    this.fireEntrySearch(trimmedQuery);

    return this.currentList;
  }

  
  private fireEntrySearch(query: string): void {
    const eventPayload: SearchEventPayload = {
      search_type: 'full_text',
      query: query
    };

    
    console.log("Firing entry_search:", eventPayload);
  }

  public getFilteredEntries(): SearchEntry[] {
    return this.currentList;
  }
}