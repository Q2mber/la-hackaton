import { AngularTestPage } from './app.po';
import { browser, element, by } from 'protractor';

describe('Starting tests for angular-app', function() {
  let page: AngularTestPage;

  beforeEach(() => {
    page = new AngularTestPage();
  });

  it('website title should be angular-app', () => {
    page.navigateTo('/');
    return browser.getTitle().then((result)=>{
      expect(result).toBe('angular-app');
    })
  });

  it('navbar-brand should be hyper-file-storage@0.1.10',() => {
    var navbarBrand = element(by.css('.navbar-brand')).getWebElement();
    expect(navbarBrand.getText()).toBe('hyper-file-storage@0.1.10');
  });

  
    it('Document component should be loadable',() => {
      page.navigateTo('/Document');
      var assetName = browser.findElement(by.id('assetName'));
      expect(assetName.getText()).toBe('Document');
    });

    it('Document table should have 7 columns',() => {
      page.navigateTo('/Document');
      element.all(by.css('.thead-cols th')).then(function(arr) {
        expect(arr.length).toEqual(7); // Addition of 1 for 'Action' column
      });
    });

  
    it('SomeAsset component should be loadable',() => {
      page.navigateTo('/SomeAsset');
      var assetName = browser.findElement(by.id('assetName'));
      expect(assetName.getText()).toBe('SomeAsset');
    });

    it('SomeAsset table should have 3 columns',() => {
      page.navigateTo('/SomeAsset');
      element.all(by.css('.thead-cols th')).then(function(arr) {
        expect(arr.length).toEqual(3); // Addition of 1 for 'Action' column
      });
    });

  

});
