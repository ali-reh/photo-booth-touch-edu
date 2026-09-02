export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Photo {
  id: string;
  photo_url: string;
  created_at: string;
}

export interface Visitor {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  company: string | null;
  interests: string[];
  rating: number | null;
  face_embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface PhotoVisitor {
  id: string;
  photo_id: string;
  visitor_id: string;
  face_index: number;
  created_at: string;
}

export type VisitorInsert = Omit<Visitor, 'id' | 'created_at' | 'updated_at'>;

export interface MatchedVisitor extends Visitor {
  similarity: number;
}

export interface Database {
  public: {
    Tables: {
      photos: {
        Row: Photo;
        Insert: {
          id?: string;
          photo_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          photo_url?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      visitors: {
        Row: Visitor;
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          email?: string | null;
          company?: string | null;
          interests?: string[];
          rating?: number | null;
          face_embedding?: number[] | string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string;
          email?: string | null;
          company?: string | null;
          interests?: string[];
          rating?: number | null;
          face_embedding?: number[] | string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      photo_visitors: {
        Row: PhotoVisitor;
        Insert: {
          id?: string;
          photo_id: string;
          visitor_id: string;
          face_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          photo_id?: string;
          visitor_id?: string;
          face_index?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'photo_visitors_photo_id_fkey';
            columns: ['photo_id'];
            isOneToOne: false;
            referencedRelation: 'photos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'photo_visitors_visitor_id_fkey';
            columns: ['visitor_id'];
            isOneToOne: false;
            referencedRelation: 'visitors';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_visitor_face: {
        Args: {
          query_embedding: string;
          match_threshold?: number;
          match_count?: number;
        };
        Returns: MatchedVisitor[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
