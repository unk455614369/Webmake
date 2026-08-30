export type Source={id:string,type:'url'|'text'|'poster',value:string,status:'ready'|'processing'|'error'};
export type BrandBrief={name:string,category:string,audience:string,goal:string,voice:string,colors:string[],services:string[],proof:string[],contacts:string[],summary:string};
export type GeneratedSite={headline:string,subheadline:string,sections:{title:string,body:string}[],cta:string,seoTitle:string,seoDescription:string,html:string};
