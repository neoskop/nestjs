declare module "cloudinary" {
    namespace cloudinary {
        export interface ICloudinaryConfig {
            cloud_name?: string;
            api_key?: string;
            api_secret?: string;
            cdn_subdomain?: boolean;
            private_cdn?: boolean;
            secure_distribution?: string;
            cname?: string;
            secure?: boolean;

            upload_prefix?: string;
        }

        export type Cb<T = IV2ApiResponse> = null | ((err : any|null, r? : T) => void);

        export interface IV2ApiOptions {
            upload_prefix?: string;
            cloud_name?: string;
            api_key?: string;
            api_secret?: string;
            content_type?: string;
            timeout?: number;
        }

        export type  IV2ApiResponse<T extends {} = {}> = T & {
            error?: { message: string, http_code: number }|any;
            next_cursor?: string;
            rate_limit_allowed: number;
            rate_limit_remaining: number;
            rate_limit_reset_at: Date
        }

        export type ResourceType = 'image'|'video'|'raw';
        export type Direction = 'asc'|'desc'|1|-1;

        export interface IModeration {
            kind: string;
            status: string;
        }

        export interface IFolder {
            name: string;
            path: string;
        }

        export interface IResource {
            public_id: string;
            format: string;
            version: number;
            resource_type: ResourceType;
            type: string;
            created_at: Date|string; // TODO: check exact type
            bytes: number;
            width?: number;
            height?: number;
            url: string;
            secure_url: string;
            tags?: string[];
            context?: {
                custom?: {
                    alt?: string;
                    caption?: string;
                    [key: string]: string|undefined;
                }
            };
            moderations?: IModeration[];
        }

        export interface IDerivative {
            transformation: string;
            format: string;
            bytes: string;
            id: string;
            url: string;
            secure_url: string;
        }

        export interface ITransformation {
            name: string;
            allowed_for_strict: boolean;
            used: boolean;
            named: boolean;
        }

        export interface ITransformationOptions {
            responsive_width?: number|string;
            width?: number|string;
            height?: number|string;
            size?: string;
            overlay?: any;
            underlay?: any;
            crop?: any;
            angle?: any;
            background?: any;
            color?: any;
            effect?: any;
            border?: any;
            flags?: any;
            dpr?: any;
            offset?: any;
            start_offset?: any;
            end_offset?: any;
            if?: any;
        }

        export interface IDetailedResource extends IResource {
            derived: IDerivative[];
        }

        // TODO: check for exact type https://github.com/cloudinary/cloudinary_npm/blob/master/src/utils.coffee#L478
        export interface IUpdatableResourceParams {
            access_control?: any
            auto_tagging?: number;
            background_removal?: boolean;
            categorization?: any;
            context?: any;
            custom_coordinates?: any;
            detection?: any;
            face_coordinates?: any;
            headers?: any;
            notification_url?: string;
            ocr?: boolean;
            raw_convert?: any;
            similarity_search?: any;
            tags?: string|string[];
        }

        export interface ISearch {
            expression(exp : string) : this;
            max_results(max_results : number) : this;
            next_cursor(next_cursor : string) : this;
            aggregate(value : string) : this;
            with_field(field : string) : this;
            sort_by(field : string, dir?: Direction) : this;

            to_query() : object;

            execute(options?: IV2ApiOptions, cb?: Cb) : Promise<IV2ApiResponse<{
                resources: IDetailedResource[],
                total_count: number;
                time: number;
            }>>;
        }

        export function config<K extends keyof ICloudinaryConfig>(key : K, value : ICloudinaryConfig[K]) : ICloudinaryConfig;
        export function config(config : ICloudinaryConfig) : ICloudinaryConfig;
        export function config(new_config?: boolean) : ICloudinaryConfig;
        export function config<K extends keyof ICloudinaryConfig>(key : K) : ICloudinaryConfig[K];
        export function config(key : string) : any;

        export namespace v2 {
            export namespace api {
                export function ping(options?: IV2ApiOptions, cb? : Cb) : Promise<IV2ApiResponse<{ status: 'ok'|string }>>;

                export function resource_types(options?: IV2ApiOptions, cb?: Cb) : Promise<IV2ApiResponse<{ resource_types: ResourceType[] }>>;

                export function resources(options?: IV2ApiOptions & {
                    resource_type?: ResourceType;
                    type?: string;
                    prefix?: string;
                    public_ids?: string;
                    max_results?: number;
                    next_cursor?: any;
                    start_at?: string;
                    direction?: Direction;
                    tags?: boolean;
                    context?: boolean;
                    moderations?: boolean;
                }, cb?: Cb) : Promise<IV2ApiResponse<{ resources: IResource[] }>>

                export function resources_by_tag(tag: string, options?: IV2ApiOptions & {
                    resource_type?: ResourceType;
                    public_ids?: string;
                    max_results?: number;
                    next_cursor?: any;
                    direction?: Direction;
                    tags?: boolean;
                    context?: boolean;
                    moderations?: boolean;
                }, cb?: Cb) : Promise<IV2ApiResponse<{ resources: IResource[] }>>

                export function resources_by_context(key: string, value : string, options?: IV2ApiOptions & {
                    resource_type?: ResourceType;
                    public_ids?: string;
                    max_results?: number;
                    next_cursor?: any;
                    direction?: Direction;
                    tags?: boolean;
                    context?: boolean;
                    moderations?: boolean;
                }, cb?: Cb) : Promise<IV2ApiResponse<{ resources: IResource[] }>>

                export function resources_by_moderation(kind: string, status : string, options?: IV2ApiOptions & {
                    resource_type?: ResourceType;
                    public_ids?: string;
                    max_results?: number;
                    next_cursor?: any;
                    direction?: Direction;
                    tags?: boolean;
                    context?: boolean;
                    moderations?: boolean;
                }, cb?: Cb) : Promise<IV2ApiResponse<{ resources: IResource[] }>>

                export function resources_by_ids(ids: string[], options?: IV2ApiOptions & {
                    resource_type?: ResourceType;
                    type?: string;
                    tags?: boolean;
                    context?: boolean;
                    moderations?: boolean;
                }, cb?: Cb) : Promise<IV2ApiResponse<{ resources: IResource[] }>>

                export function resource(public_id: string, options?: IV2ApiOptions & {
                    resource_type?: ResourceType;
                    type?: string;
                    exif?: any;
                    colors?: any;
                    faces?: any;
                    image_metadata?: any;
                    pages?: any;
                    phash?: any;
                    coordinates?: any;
                    max_results?: number;
                }, cb?: Cb) : Promise<IV2ApiResponse<IDetailedResource>>

                export function restore(ids : string[], options?: IV2ApiOptions & {
                    resource_type?: ResourceType;
                    type?: string;
                }, cb?: Cb) : Promise<IV2ApiResponse>;

                export function update(id : string, options?: IV2ApiOptions & IUpdatableResourceParams & {
                    resource_type?: ResourceType;
                    type?: string;
                    moderation_status?: string;
                }, cb?: Cb) : Promise<IV2ApiResponse>;

                export function delete_resources(ids : string[], options?: IV2ApiOptions & {
                    resource_type?: ResourceType;
                    type?: string;
                }, cb?: Cb) : Promise<IV2ApiResponse>;

                export function delete_resources_by_prefix(prefix: string, options?: IV2ApiOptions & {
                    resource_type?: ResourceType;
                    type?: string;
                }, cb?: Cb) : Promise<IV2ApiResponse>;

                export function delete_resources_by_tag(tag: string, options?: IV2ApiOptions & {
                    resource_type?: ResourceType;
                    type?: string;
                }, cb?: Cb) : Promise<IV2ApiResponse>;

                export function delete_all_resources(tag: string, options?: IV2ApiOptions & {
                    resource_type?: ResourceType;
                    type?: string;
                }, cb?: Cb) : Promise<IV2ApiResponse>;

                export function delete_derived_resources(ids: string[], options?: IV2ApiOptions, cb?: Cb) : Promise<IV2ApiResponse>;

                export function delete_derived_by_transformation(public_ids: string[], transformations: string[], options?: IV2ApiOptions & {
                    resource_type?: ResourceType;
                    type?: string;
                    invalidate?: boolean;
                }, cb?: Cb) : Promise<IV2ApiResponse>;

                export function tags(options?: IV2ApiOptions & {
                    resource_type?: ResourceType;
                }, cb?: Cb) : Promise<IV2ApiResponse<{ tags: string[] }>>;

                export function transformations(options?: IV2ApiOptions & {
                    next_cursor?: string;
                    max_results?: number;
                }, cb?: Cb) : Promise<IV2ApiResponse<{ transformations: ITransformation[] }>>;

                export function transformation(transformation: string|ITransformationOptions|ITransformationOptions[], options?: IV2ApiOptions & {
                    next_cursor?: string;
                    max_results?: number;
                }, cb?: Cb) : Promise<IV2ApiResponse<ITransformation>>;

                export function delete_transformation(transformation: string|ITransformationOptions|ITransformationOptions[], options?: IV2ApiOptions, cb?: Cb) : Promise<IV2ApiResponse>;
                export function update_transformation(transformation: string|ITransformationOptions|ITransformationOptions[], updates: { allowed_for_strict?: boolean; unsafe_update?: boolean }, options?: IV2ApiOptions, cb?: Cb) : Promise<IV2ApiResponse>;
                export function create_transformation(name : string, transformation: string|ITransformationOptions|ITransformationOptions[], options?: IV2ApiOptions, cb?: Cb) : Promise<IV2ApiResponse>;

                export function root_folders(options?: IV2ApiOptions, cb?: Cb) : Promise<IV2ApiResponse<{ folders: IFolder[] }>>
                export function sub_folders(path: string, options?: IV2ApiOptions, cb?: Cb) : Promise<IV2ApiResponse<{ folders: IFolder[] }>>
            }

            export namespace search {
                export function expression(exp : string) : ISearch;
                export function max_results(max_results : number) : ISearch;
                export function next_cursor(next_cursor : string) : ISearch;
                export function aggregate(value : string) : ISearch;
                export function with_field(field : string) : ISearch;
                export function sort_by(field : string, dir?: Direction) : ISearch;
            }

            export namespace uploader {
                import ReadableStream = NodeJS.ReadableStream;
                import WritableStream = NodeJS.WritableStream;

                /**
                 * @see https://cloudinary.com/documentation/image_upload_api_reference
                 */
                export interface IUploadOptions extends IV2ApiOptions {
                    upload_preset?: string;
                    public_id?: string;
                    folder?: string;
                    use_filename?: boolean;
                    unique_filename?: boolean;
                    resource_type?: ResourceType;
                    type?: string;
                    access_control?: { access_type: 'token' } | { access_type: 'anonymous', start?: string, end?: string };
                    access_mode?: string;
                    discard_original_filename?: boolean;
                    overwrite?: boolean;
                    tags?: string[];
                    context?: object;
                    colors?: boolean;
                    faces?: boolean;
                    image_metadata?: boolean;
                    phash?: boolean;
                    responsive_breakpoints?: object;
                    auto_tagging?: number;
                    categorization?: string;
                    detection?: string;
                    ocr?: string;
                    exif?: boolean;
                }

                export function upload(file : string|ArrayBuffer|ReadableStream, options?: IUploadOptions) : Promise<IV2ApiResponse<IResource>>

                export function upload_stream(options?: IUploadOptions, cb?: Cb) : WritableStream;
                export function upload_stream(cb?: Cb) : WritableStream;

                export interface IRenameOptions extends IV2ApiOptions {
                    resource_type?: ResourceType;
                    type?: string;
                    to_type?: string;
                    overwrite?: string;
                    invalidate?: boolean;
                }
                export function rename(from_public_id : string, to_public_id : string, options?: IRenameOptions) : Promise<IV2ApiResponse<IResource>>

                export interface ITagOptions extends IV2ApiOptions {
                    resource_type?: ResourceType;
                    type?: string;
                }
                export function add_tag(tag : string, public_ids: string[], options? : ITagOptions, cb?: Cb) : Promise<IV2ApiResponse<{ public_ids: string[] }>>
                export function remove_tag(tag : string, public_ids: string[], options? : ITagOptions, cb?: Cb) : Promise<IV2ApiResponse<{ public_ids: string[] }>>
                export function remove_all_tags(public_ids: string[], options? : ITagOptions, cb?: Cb) : Promise<IV2ApiResponse<{ public_ids: string[] }>>
                export function replace_tag(tag: string, public_ids: string[], options? : ITagOptions, cb?: Cb) : Promise<IV2ApiResponse<{ public_ids: string[] }>>

                export interface IContextOptions extends IV2ApiOptions {
                    resource_type?: ResourceType;
                    type?: string;
                }
                export function add_context(context : string|object, public_ids: string[], options? : ITagOptions, cb?: Cb) : Promise<IV2ApiResponse<{ public_ids: string[] }>>
                export function remove_all_context(public_ids: string[], options? : ITagOptions, cb?: Cb) : Promise<IV2ApiResponse<{ public_ids: string[] }>>
            }
        }
    }

    export = cloudinary;
}
